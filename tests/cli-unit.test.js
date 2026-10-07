const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { Readable, Writable } = require('node:stream');

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

let tmpDir;

function setUpTmp() {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-unit-test-'));
}

function tearDownTmp() {
  if (tmpDir && fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function testHelpVersionCallbacks() {
  const helpLogs = [];
  printHelp((msg) => helpLogs.push(msg));
  assert.strictEqual(helpLogs.length, 1);
  assert.match(helpLogs[0], /Enterprise Multi-Tenant/);
  const versionLogs = [];
  printVersion((msg) => versionLogs.push(msg));
  assert.strictEqual(versionLogs.length, 1);
  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
  assert.strictEqual(versionLogs[0], pkg.version);
}

async function testAskTrimmed() {
  const input = Readable.from(['  custom-dir  \n']);
  const output = new Writable({ write(c, e, cb) { cb(); } });
  const answer = await askQuestion('Query: ', { input, output });
  assert.strictEqual(answer, 'custom-dir');
}

async function testAskOnClose() {
  const input = new Readable({ read() { this.push(null); } });
  const output = new Writable({ write(c, e, cb) { cb(); } });
  const answer = await askQuestion('Query: ', { input, output });
  assert.strictEqual(answer, '');
}

async function testRunCliHelpVersion() {
  const ioHelp = createMockIo();
  await runCli(['-h'], ioHelp);
  assert.strictEqual(ioHelp.exitCode, 0);
  assert.match(ioHelp.stdoutLogs[0], /Usage:\s+npx azcodr/);
  const ioVersion = createMockIo();
  await runCli(['-v'], ioVersion);
  assert.strictEqual(ioVersion.exitCode, 0);
  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
  assert.strictEqual(ioVersion.stdoutLogs[0], pkg.version);
}

async function testTtyPrompt() {
  const targetDir = path.join(tmpDir, 'tty-target');
  const io = createMockIo({
    cwd: tmpDir,
    isTTY: true,
    stdin: Readable.from([targetDir + '\n'])
  });
  await runCli(['--no-git'], io);
  assert.strictEqual(io.exitCode, 0);
  assert.strictEqual(fs.existsSync(path.join(targetDir, 'AGENTS.md')), true);
}

async function testDefaultDot() {
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
}

async function testTemplateDirGuard() {
  const { getTemplateDir } = require('../lib/scaffold.js');
  const templateDir = getTemplateDir();
  const io = createMockIo({ cwd: templateDir });
  await runCli(['.'], io);
  assert.strictEqual(io.exitCode, 1);
  assert.match(io.stderrLogs[0], /Cannot scaffold into the template directory itself/);
}

function makeNonEmptyDir(name) {
  const targetDir = path.join(tmpDir, name);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'existing.txt'), 'hello');
  return targetDir;
}

async function testAcceptY() {
  const targetDir = makeNonEmptyDir('non-empty-confirm');
  const io = createMockIo({
    cwd: tmpDir,
    isTTY: true,
    stdin: Readable.from(['y\n'])
  });
  await runCli([targetDir, '--no-git'], io);
  assert.strictEqual(io.exitCode, 0);
  assert.strictEqual(fs.existsSync(path.join(targetDir, 'AGENTS.md')), true);
}

async function testAcceptYes() {
  const targetDir = makeNonEmptyDir('non-empty-confirm-yes');
  const io = createMockIo({
    cwd: tmpDir,
    isTTY: true,
    stdin: Readable.from(['yes\n'])
  });
  await runCli([targetDir, '--no-git'], io);
  assert.strictEqual(io.exitCode, 0);
  assert.strictEqual(fs.existsSync(path.join(targetDir, 'AGENTS.md')), true);
}

async function testAbortN() {
  const targetDir = makeNonEmptyDir('non-empty-abort');
  const io = createMockIo({
    cwd: tmpDir,
    isTTY: true,
    stdin: Readable.from(['n\n'])
  });
  await runCli([targetDir, '--no-git'], io);
  assert.strictEqual(io.exitCode, 0);
  assert.strictEqual(io.stdoutLogs.includes('Scaffolding aborted.'), true);
  assert.strictEqual(fs.existsSync(path.join(targetDir, 'AGENTS.md')), false);
}

async function testShortFlags() {
  const targetDir = path.join(tmpDir, 'short-flags');
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'file.txt'), 'content');
  const io = createMockIo({ cwd: tmpDir });
  await runCli([targetDir, '-f', '-s', '--no-git'], io);
  assert.strictEqual(io.exitCode, 0);
  assert.strictEqual(io.stdoutLogs.length, 0);
  assert.strictEqual(fs.existsSync(path.join(targetDir, 'AGENTS.md')), true);
}

async function testGitEnabled() {
  const targetDir = path.join(tmpDir, 'git-enabled-target');
  const io = createMockIo({ cwd: tmpDir });
  await runCli([targetDir], io);
  assert.strictEqual(io.exitCode, 0);
  assert.strictEqual(fs.existsSync(path.join(targetDir, '.git')), true);
  assert.strictEqual(io.stdoutLogs.some((l) => l.includes('Git repository initialized')), true);
}

async function testExistingFile() {
  const filePath = path.join(tmpDir, 'file-blocking-dir');
  fs.writeFileSync(filePath, 'not-a-directory');
  const io = createMockIo({ cwd: tmpDir });
  await runCli([filePath], io);
  assert.strictEqual(io.exitCode, 1);
  assert.match(io.stderrLogs[0], /already exists and is not a directory/);
}

async function testExtraArgs() {
  const io = createMockIo({ cwd: tmpDir });
  await runCli(['dir1', 'dir2'], io);
  assert.strictEqual(io.exitCode, 1);
  assert.match(io.stderrLogs[0], /Unexpected argument 'dir2'/);
}

async function testScaffoldFailure() {
  const io = createMockIo({
    cwd: tmpDir,
    scaffold: () => {
      throw new Error('Disk write failure');
    }
  });
  await runCli(['my-dir'], io);
  assert.strictEqual(io.exitCode, 1);
  assert.match(io.stderrLogs[0], /Scaffolding failed: Disk write failure/);
}

function testDefaultConsole() {
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
}

async function mainVersionBranch(state) {
  process.exit = (code) => {
    state.exitCode = code;
  };
  process.argv = [process.execPath, CLI_PATH, '--version'];
  await main();
  assert.strictEqual(state.exitCode, 0);
}

async function mainErrorBranch(state) {
  process.exit = (code) => {
    state.exitCode = code;
  };
  console.error = (msg, err) => {
    state.errorLogged = err || msg;
  };
  process.argv = null;
  await main();
  assert.strictEqual(state.exitCode, 1);
  assert.match(String(state.errorLogged), /TypeError/);
}

async function testMain() {
  const origArgv = process.argv;
  const origExit = process.exit;
  const origError = console.error;
  const state = { exitCode: null, errorLogged: null };
  try {
    await mainVersionBranch(state);
    await mainErrorBranch(state);
  } finally {
    process.argv = origArgv;
    process.exit = origExit;
    console.error = origError;
  }
}

describe('CLI Unit: help, version and prompts', () => {
  beforeEach(setUpTmp);
  afterEach(tearDownTmp);
  test('printHelp and printVersion invoke output callback', testHelpVersionCallbacks);
  test('askQuestion resolves trimmed answer on input', testAskTrimmed);
  test('askQuestion resolves empty string on stream close', testAskOnClose);
});

describe('CLI Unit: runCli flags and TTY', () => {
  beforeEach(setUpTmp);
  afterEach(tearDownTmp);
  test('runCli responds to -h and -v', testRunCliHelpVersion);
  test('runCli prompts for target directory in TTY when not supplied', testTtyPrompt);
  test('runCli defaults target directory to dot when empty string entered in TTY', testDefaultDot);
});

describe('CLI Unit: guards and confirmations', () => {
  beforeEach(setUpTmp);
  afterEach(tearDownTmp);
  test('runCli prevents scaffolding into templateDir itself', testTemplateDirGuard);
  test('runCli in TTY prompts on non-empty directory and user accepts with y', testAcceptY);
  test('runCli in TTY prompts on non-empty directory and user accepts with yes', testAcceptYes);
});

describe('CLI Unit: abort, flags and git', () => {
  beforeEach(setUpTmp);
  afterEach(tearDownTmp);
  test('runCli in TTY prompts on non-empty directory and aborts when user enters n', testAbortN);
  test('runCli handles short flag -s and -f', testShortFlags);
  test('runCli scaffolds project and initializes git when git is enabled', testGitEnabled);
});

describe('CLI Unit: failures and entry point', () => {
  beforeEach(setUpTmp);
  afterEach(tearDownTmp);
  test('runCli fails when target path is an existing regular file', testExistingFile);
  test('runCli fails when extra positional arguments are provided', testExtraArgs);
  test('runCli handles scaffolding failure gracefully', testScaffoldFailure);
  test('printHelp and printVersion work with default console.log', testDefaultConsole);
  test('main executes runCli successfully and catches unexpected errors', testMain);
});
