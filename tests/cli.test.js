const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { Readable, Writable } = require('node:stream');
const { execFileSync, execSync } = require('node:child_process');

const CLI_PATH = path.resolve(__dirname, '..', 'bin', 'azcodr.js');
const PKG_PATH = path.resolve(__dirname, '..', 'package.json');
const {
  runCli,
  askQuestion,
  printHelp,
  printVersion,
  main
} = require('../bin/azcodr.js');

function createMockIo(options = {}) {
  const stdoutLogs = [];
  const stderrLogs = [];
  let exitCode = null;

  const stdin = options.stdin || new Readable({ read() { this.push(null); } });
  if (options.isTTY !== undefined) {
    stdin.isTTY = options.isTTY;
  }

  const stdout = options.stdout || new Writable({
    write(chunk, enc, cb) { cb(); }
  });

  return {
    out: (msg) => stdoutLogs.push(msg),
    err: (msg) => stderrLogs.push(msg),
    exit: (code) => {
      exitCode = code;
      return code;
    },
    stdin,
    stdout,
    cwd: options.cwd || process.cwd(),
    templateDir: options.templateDir,
    scaffold: options.scaffold,
    get stdoutLogs() { return stdoutLogs; },
    get stderrLogs() { return stderrLogs; },
    get exitCode() { return exitCode; }
  };
}

describe('CLI Outer-Loop Acceptance Tests', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-cli-test-'));
  });

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('CLI responds to --version and -v with package version', () => {
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
    const outputLong = execFileSync(process.execPath, [CLI_PATH, '--version'], {
      encoding: 'utf-8'
    }).trim();
    assert.strictEqual(outputLong, pkg.version);

    const outputShort = execFileSync(process.execPath, [CLI_PATH, '-v'], {
      encoding: 'utf-8'
    }).trim();
    assert.strictEqual(outputShort, pkg.version);
  });

  test('CLI responds to --help and -h with command line usage information', () => {
    const outputLong = execFileSync(process.execPath, [CLI_PATH, '--help'], {
      encoding: 'utf-8'
    });
    assert.match(outputLong, /Usage:\s+npx azcodr/);
    assert.match(outputLong, /--force/);
    assert.match(outputLong, /--dry-run/);
    assert.match(outputLong, /--silent/);

    const outputShort = execFileSync(process.execPath, [CLI_PATH, '-h'], {
      encoding: 'utf-8'
    });
    assert.match(outputShort, /Usage:\s+npx azcodr/);
  });

  test('CLI scaffolds a target directory successfully and copies .editorconfig', () => {
    const targetProjectDir = path.join(tmpDir, 'test-enterprise-app');

    const output = execFileSync(process.execPath, [CLI_PATH, targetProjectDir, '--no-git'], {
      encoding: 'utf-8'
    });

    assert.match(output, /initialized successfully/i);
    assert.strictEqual(fs.existsSync(path.join(targetProjectDir, 'AGENTS.md')), true);
    assert.strictEqual(fs.existsSync(path.join(targetProjectDir, 'CLAUDE.md')), true);
    assert.strictEqual(fs.existsSync(path.join(targetProjectDir, 'agents.md')), true);
    assert.strictEqual(fs.existsSync(path.join(targetProjectDir, 'GEMINI.md')), true);
    assert.strictEqual(fs.existsSync(path.join(targetProjectDir, '.cursorrules')), true);
    assert.strictEqual(fs.existsSync(path.join(targetProjectDir, '.windsurfrules')), true);
    assert.strictEqual(fs.existsSync(path.join(targetProjectDir, '.editorconfig')), true);

    const validatorScript = path.join(
      targetProjectDir,
      '.agents',
      'skills',
      'agentic-architect',
      'scripts',
      'validate_agentic_configs.sh'
    );
    assert.strictEqual(fs.existsSync(validatorScript), true);

    const validationOutput = execSync(`bash "${validatorScript}" "${targetProjectDir}"`, {
      encoding: 'utf-8'
    });

    assert.match(validationOutput, /SUCCESS: All agentic configurations are valid and healthy!/);
  });

  test('CLI executes --dry-run and -d mode without creating files on disk', () => {
    const dryRunTarget = path.join(tmpDir, 'dry-run-target');

    const outputLong = execFileSync(process.execPath, [CLI_PATH, dryRunTarget, '--dry-run'], {
      encoding: 'utf-8'
    });
    assert.match(outputLong, /DRY RUN: Simulating azcodr scaffolding/);
    assert.match(outputLong, /\[preview\] copy: AGENTS\.md/);
    assert.match(outputLong, /Dry run completed\. 0 files modified on disk\./);
    assert.strictEqual(fs.existsSync(dryRunTarget), false);

    const outputShort = execFileSync(process.execPath, [CLI_PATH, dryRunTarget, '-d'], {
      encoding: 'utf-8'
    });
    assert.match(outputShort, /DRY RUN: Simulating azcodr scaffolding/);
    assert.strictEqual(fs.existsSync(dryRunTarget), false);
  });

  test('CLI executes --silent and -s suppressing non-error output', () => {
    const silentTarget = path.join(tmpDir, 'silent-target');
    const output = execFileSync(process.execPath, [CLI_PATH, silentTarget, '--silent', '--no-git'], {
      encoding: 'utf-8'
    });
    assert.strictEqual(output.trim(), '');
    assert.strictEqual(fs.existsSync(path.join(silentTarget, 'AGENTS.md')), true);
  });

  test('CLI fast-fails on unknown flag with exit code 1', () => {
    assert.throws(
      () => {
        execFileSync(process.execPath, [CLI_PATH, '--invalid-flag'], {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe']
        });
      },
      (error) => {
        assert.match(error.stderr || error.stdout, /Unknown argument '--invalid-flag'/);
        assert.strictEqual(error.status, 1);
        return true;
      }
    );
  });

  test('CLI fails with clear error when target directory is non-empty without --force in non-interactive mode', () => {
    const targetProjectDir = path.join(tmpDir, 'non-empty-dir');
    fs.mkdirSync(targetProjectDir, { recursive: true });
    fs.writeFileSync(path.join(targetProjectDir, 'foo.txt'), 'bar');

    assert.throws(
      () => {
        execFileSync(process.execPath, [CLI_PATH, targetProjectDir], {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe']
        });
      },
      (error) => {
        assert.match(error.stderr || error.stdout, /not empty/i);
        return true;
      }
    );
  });

  test('CLI succeeds on non-empty target directory when --force flag is passed', () => {
    const targetProjectDir = path.join(tmpDir, 'non-empty-dir');
    fs.mkdirSync(targetProjectDir, { recursive: true });
    fs.writeFileSync(path.join(targetProjectDir, 'foo.txt'), 'bar');

    const output = execFileSync(process.execPath, [CLI_PATH, targetProjectDir, '--force', '--no-git'], {
      encoding: 'utf-8'
    });

    assert.match(output, /initialized successfully/i);
    assert.strictEqual(fs.existsSync(path.join(targetProjectDir, 'foo.txt')), true);
    assert.strictEqual(fs.existsSync(path.join(targetProjectDir, 'AGENTS.md')), true);
  });
});

describe('CLI In-Process Unit Tests & Branch Coverage', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-unit-test-'));
  });

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('printHelp and printVersion invoke output callback', () => {
    const helpLogs = [];
    printHelp((msg) => helpLogs.push(msg));
    assert.strictEqual(helpLogs.length, 1);
    assert.match(helpLogs[0], /Enterprise Multi-Tenant/);

    const versionLogs = [];
    printVersion((msg) => versionLogs.push(msg));
    assert.strictEqual(versionLogs.length, 1);
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
    assert.strictEqual(versionLogs[0], pkg.version);
  });

  test('askQuestion resolves trimmed answer on input', async () => {
    const input = Readable.from(['  custom-dir  \n']);
    const output = new Writable({ write(c, e, cb) { cb(); } });
    const answer = await askQuestion('Query: ', { input, output });
    assert.strictEqual(answer, 'custom-dir');
  });

  test('askQuestion resolves empty string on stream close', async () => {
    const input = new Readable({ read() { this.push(null); } });
    const output = new Writable({ write(c, e, cb) { cb(); } });
    const answer = await askQuestion('Query: ', { input, output });
    assert.strictEqual(answer, '');
  });

  test('runCli responds to -h and -v', async () => {
    const ioHelp = createMockIo();
    await runCli(['-h'], ioHelp);
    assert.strictEqual(ioHelp.exitCode, 0);
    assert.match(ioHelp.stdoutLogs[0], /Usage:\s+npx azcodr/);

    const ioVersion = createMockIo();
    await runCli(['-v'], ioVersion);
    assert.strictEqual(ioVersion.exitCode, 0);
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
    assert.strictEqual(ioVersion.stdoutLogs[0], pkg.version);
  });

  test('runCli prompts for target directory in TTY when not supplied', async () => {
    const targetDir = path.join(tmpDir, 'tty-target');
    const io = createMockIo({
      cwd: tmpDir,
      isTTY: true,
      stdin: Readable.from([targetDir + '\n'])
    });

    await runCli(['--no-git'], io);
    assert.strictEqual(io.exitCode, 0);
    assert.strictEqual(fs.existsSync(path.join(targetDir, 'AGENTS.md')), true);
  });

  test('runCli defaults target directory to dot when empty string entered in TTY', async () => {
    const subDir = path.join(tmpDir, 'default-dot');
    fs.mkdirSync(subDir, { recursive: true });

    const io = createMockIo({
      cwd: subDir,
      isTTY: true,
      stdin: Readable.from(['\n'])
    });

    await runCli(['--no-git', '--force'], io);
    assert.strictEqual(io.exitCode, 0);
    assert.strictEqual(fs.existsSync(path.join(subDir, 'AGENTS.md')), true);
  });

  test('runCli prevents scaffolding into templateDir itself', async () => {
    const { getTemplateDir } = require('../lib/scaffold.js');
    const templateDir = getTemplateDir();
    const io = createMockIo({ cwd: templateDir });

    await runCli(['.'], io);
    assert.strictEqual(io.exitCode, 1);
    assert.match(io.stderrLogs[0], /Cannot scaffold into the template directory itself/);
  });

  test('runCli in TTY prompts on non-empty directory and user accepts with y', async () => {
    const targetDir = path.join(tmpDir, 'non-empty-confirm');
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'existing.txt'), 'hello');

    const io = createMockIo({
      cwd: tmpDir,
      isTTY: true,
      stdin: Readable.from(['y\n'])
    });

    await runCli([targetDir, '--no-git'], io);
    assert.strictEqual(io.exitCode, 0);
    assert.strictEqual(fs.existsSync(path.join(targetDir, 'AGENTS.md')), true);
  });

  test('runCli in TTY prompts on non-empty directory and user accepts with yes', async () => {
    const targetDir = path.join(tmpDir, 'non-empty-confirm-yes');
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'existing.txt'), 'hello');

    const io = createMockIo({
      cwd: tmpDir,
      isTTY: true,
      stdin: Readable.from(['yes\n'])
    });

    await runCli([targetDir, '--no-git'], io);
    assert.strictEqual(io.exitCode, 0);
    assert.strictEqual(fs.existsSync(path.join(targetDir, 'AGENTS.md')), true);
  });

  test('runCli in TTY prompts on non-empty directory and aborts when user enters n', async () => {
    const targetDir = path.join(tmpDir, 'non-empty-abort');
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'existing.txt'), 'hello');

    const io = createMockIo({
      cwd: tmpDir,
      isTTY: true,
      stdin: Readable.from(['n\n'])
    });

    await runCli([targetDir, '--no-git'], io);
    assert.strictEqual(io.exitCode, 0);
    assert.strictEqual(io.stdoutLogs.includes('Scaffolding aborted.'), true);
    assert.strictEqual(fs.existsSync(path.join(targetDir, 'AGENTS.md')), false);
  });

  test('runCli handles short flag -s and -f', async () => {
    const targetDir = path.join(tmpDir, 'short-flags');
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'file.txt'), 'content');

    const io = createMockIo({ cwd: tmpDir });
    await runCli([targetDir, '-f', '-s', '--no-git'], io);
    assert.strictEqual(io.exitCode, 0);
    assert.strictEqual(io.stdoutLogs.length, 0);
    assert.strictEqual(fs.existsSync(path.join(targetDir, 'AGENTS.md')), true);
  });

  test('runCli scaffolds project and initializes git when git is enabled', async () => {
    const targetDir = path.join(tmpDir, 'git-enabled-target');
    const io = createMockIo({ cwd: tmpDir });

    await runCli([targetDir], io);
    assert.strictEqual(io.exitCode, 0);
    assert.strictEqual(fs.existsSync(path.join(targetDir, '.git')), true);
    assert.strictEqual(io.stdoutLogs.some(l => l.includes('Git repository initialized')), true);
  });

  test('runCli fails when target path is an existing regular file', async () => {
    const filePath = path.join(tmpDir, 'file-blocking-dir');
    fs.writeFileSync(filePath, 'not-a-directory');

    const io = createMockIo({ cwd: tmpDir });
    await runCli([filePath], io);
    assert.strictEqual(io.exitCode, 1);
    assert.match(io.stderrLogs[0], /already exists and is not a directory/);
  });

  test('runCli handles scaffolding failure gracefully', async () => {
    const io = createMockIo({
      cwd: tmpDir,
      scaffold: () => {
        throw new Error('Disk write failure');
      }
    });

    await runCli(['my-dir'], io);
    assert.strictEqual(io.exitCode, 1);
    assert.match(io.stderrLogs[0], /Scaffolding failed: Disk write failure/);
  });

  test('printHelp and printVersion work with default console.log', () => {
    const origLog = console.log;
    const logged = [];
    try {
      console.log = (msg) => logged.push(msg);
      printHelp();
      printVersion();
      assert.strictEqual(logged.length, 2);
    } finally {
      console.log = origLog;
    }
  });

  test('main executes runCli successfully and catches unexpected errors', async () => {
    const origArgv = process.argv;
    const origExit = process.exit;
    const origError = console.error;
    let exitCode = null;
    let errorLogged = null;

    try {
      process.exit = (code) => {
        exitCode = code;
      };
      process.argv = [process.execPath, CLI_PATH, '--version'];
      await main();
      assert.strictEqual(exitCode, 0);

      // Trigger unexpected error branch
      process.exit = (code) => {
        exitCode = code;
      };
      console.error = (msg, err) => {
        errorLogged = err || msg;
      };
      process.argv = null;
      await main();
      assert.strictEqual(exitCode, 1);
      assert.match(String(errorLogged), /TypeError/);
    } finally {
      process.argv = origArgv;
      process.exit = origExit;
      console.error = origError;
    }
  });
});
