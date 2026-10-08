import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync, execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.resolve(__dirname, '..', 'bin', 'azcodr.js');
const PKG_PATH = path.resolve(__dirname, '..', 'package.json');

let tmpDir: string;

function setUpTmp() {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-cli-test-'));
}

function tearDownTmp() {
  if (tmpDir && fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function assertScaffoldedFiles(targetProjectDir: string) {
  assert.strictEqual(fs.existsSync(path.join(targetProjectDir, 'AGENTS.md')), true);
  assert.strictEqual(fs.existsSync(path.join(targetProjectDir, 'CLAUDE.md')), true);
  assert.strictEqual(fs.existsSync(path.join(targetProjectDir, 'agents.md')), true);
  assert.strictEqual(fs.existsSync(path.join(targetProjectDir, 'GEMINI.md')), true);
  assert.strictEqual(fs.existsSync(path.join(targetProjectDir, '.cursorrules')), true);
  assert.strictEqual(fs.existsSync(path.join(targetProjectDir, '.windsurfrules')), true);
  assert.strictEqual(fs.existsSync(path.join(targetProjectDir, '.editorconfig')), true);
  assert.strictEqual(fs.existsSync(path.join(targetProjectDir, 'LICENSE')), true);
  assert.strictEqual(fs.existsSync(path.join(targetProjectDir, '.github', 'copilot-instructions.md')), true);
  assert.strictEqual(fs.existsSync(path.join(targetProjectDir, 'package.json')), true);
}

function assertValidatorScript(targetProjectDir: string) {
  const validatorScript = path.join(
    targetProjectDir,
    '.agents',
    'skills',
    'agentic-architect',
    'scripts',
    'validate_agentic_configs.sh'
  );
  assert.strictEqual(fs.existsSync(validatorScript), true);
}

function testVersion() {
  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
  const outputLong = execFileSync(process.execPath, [CLI_PATH, '--version'], {
    encoding: 'utf-8'
  }).trim();
  assert.strictEqual(outputLong, pkg.version);
  const outputShort = execFileSync(process.execPath, [CLI_PATH, '-v'], {
    encoding: 'utf-8'
  }).trim();
  assert.strictEqual(outputShort, pkg.version);
}

function testHelp() {
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
}

function testScaffold() {
  const targetProjectDir = path.join(tmpDir, 'test-enterprise-app');
  const output = execFileSync(process.execPath, [CLI_PATH, targetProjectDir, '--no-git'], {
    encoding: 'utf-8'
  });
  assert.match(output, /initialized successfully/i);
  assertScaffoldedFiles(targetProjectDir);
  assertValidatorScript(targetProjectDir);
  const npmOut = execSync('npm run validate', { cwd: targetProjectDir, encoding: 'utf-8' });
  assert.match(npmOut, /SUCCESS: All agentic configurations are valid and healthy!/);
}

function testDryRun() {
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
}

function testSilent() {
  const silentTarget = path.join(tmpDir, 'silent-target');
  const output = execFileSync(process.execPath, [CLI_PATH, silentTarget, '--silent', '--no-git'], {
    encoding: 'utf-8'
  });
  assert.strictEqual(output.trim(), '');
  assert.strictEqual(fs.existsSync(path.join(silentTarget, 'AGENTS.md')), true);
}

function testUnknownFlag() {
  assert.throws(
    () => {
      execFileSync(process.execPath, [CLI_PATH, '--invalid-flag'], {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
    },
    (error: any) => {
      assert.match(error.stderr || error.stdout, /Unknown argument '--invalid-flag'/);
      assert.strictEqual(error.status, 1);
      return true;
    }
  );
}

function testNonEmptyFail() {
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
    (error: any) => {
      assert.match(error.stderr || error.stdout, /not empty/i);
      return true;
    }
  );
}

function testForce() {
  const targetProjectDir = path.join(tmpDir, 'non-empty-dir');
  fs.mkdirSync(targetProjectDir, { recursive: true });
  fs.writeFileSync(path.join(targetProjectDir, 'foo.txt'), 'bar');
  const output = execFileSync(process.execPath, [CLI_PATH, targetProjectDir, '--force', '--no-git'], {
    encoding: 'utf-8'
  });
  assert.match(output, /initialized successfully/i);
  assert.strictEqual(fs.existsSync(path.join(targetProjectDir, 'foo.txt')), true);
  assert.strictEqual(fs.existsSync(path.join(targetProjectDir, 'AGENTS.md')), true);
}

function testExtraArg() {
  assert.throws(
    () => {
      execFileSync(process.execPath, [CLI_PATH, 'dir1', 'extra-arg'], {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
    },
    (error: any) => {
      assert.match(error.stderr || error.stdout, /Unexpected argument 'extra-arg'/);
      assert.strictEqual(error.status, 1);
      return true;
    }
  );
}

function testStepNumbering() {
  const subDir = path.join(tmpDir, 'dot-dir');
  fs.mkdirSync(subDir, { recursive: true });
  const output = execFileSync(process.execPath, [CLI_PATH, '.', '--no-git'], {
    cwd: subDir,
    encoding: 'utf-8'
  });
  assert.match(output, /Next steps:\s+1\. Open the project/);
  assert.doesNotMatch(output, /Next steps:\s+2\. Open the project/);
}

describe('CLI Acceptance: version and help', () => {
  beforeEach(setUpTmp);
  afterEach(tearDownTmp);
  test('CLI responds to --version and -v with package version', testVersion);
  test('CLI responds to --help and -h with command line usage information', testHelp);
});

describe('CLI Acceptance: scaffold and dry-run', () => {
  beforeEach(setUpTmp);
  afterEach(tearDownTmp);
  test('CLI scaffolds a target directory successfully and copies .editorconfig', testScaffold);
  test('CLI executes --dry-run and -d mode without creating files on disk', testDryRun);
});

describe('CLI Acceptance: flags and errors', () => {
  beforeEach(setUpTmp);
  afterEach(tearDownTmp);
  test('CLI executes --silent and -s suppressing non-error output', testSilent);
  test('CLI fast-fails on unknown flag with exit code 1', testUnknownFlag);
  test('CLI fast-fails on unexpected extra argument with exit code 1', testExtraArg);
});

describe('CLI Acceptance: target directory handling', () => {
  beforeEach(setUpTmp);
  afterEach(tearDownTmp);
  test('CLI fails with clear error when target directory is non-empty', testNonEmptyFail);
  test('CLI succeeds on non-empty target directory when --force flag is passed', testForce);
  test('CLI numbers steps starting from 1 when scaffolding into current directory dot', testStepNumbering);
});
