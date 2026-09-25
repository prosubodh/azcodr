const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync, execSync } = require('node:child_process');

const CLI_PATH = path.resolve(__dirname, '..', 'bin', 'azcodr.js');
const PKG_PATH = path.resolve(__dirname, '..', 'package.json');

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

  test('CLI responds to --version with package version', () => {
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
    const output = execFileSync(process.execPath, [CLI_PATH, '--version'], {
      encoding: 'utf-8'
    }).trim();

    assert.strictEqual(output, pkg.version);
  });

  test('CLI responds to --help with command line usage information', () => {
    const output = execFileSync(process.execPath, [CLI_PATH, '--help'], {
      encoding: 'utf-8'
    });

    assert.match(output, /Usage:\s+npx azcodr/);
    assert.match(output, /--force/);
    assert.match(output, /--no-git/);
  });

  test('CLI scaffolds a target directory successfully and passes agentic validation', () => {
    const targetProjectDir = path.join(tmpDir, 'test-enterprise-app');

    const output = execFileSync(process.execPath, [CLI_PATH, targetProjectDir, '--no-git'], {
      encoding: 'utf-8'
    });

    assert.match(output, /initialized successfully/i);
    assert.strictEqual(fs.existsSync(path.join(targetProjectDir, 'AGENTS.md')), true);
    assert.strictEqual(fs.existsSync(path.join(targetProjectDir, 'CLAUDE.md')), true);
    assert.strictEqual(fs.existsSync(path.join(targetProjectDir, 'agents.md')), true);
    assert.strictEqual(fs.existsSync(path.join(targetProjectDir, 'changes.md')), true);

    // Run validate_agentic_configs.sh inside the newly scaffolded project!
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

  test('CLI logs an upstream change into changes.md via change command', () => {
    const output = execFileSync(
      process.execPath,
      [CLI_PATH, 'change', 'Add gRPC streaming rule', '-c', 'Rule', '-r', 'Support bidirectional streams'],
      {
        cwd: tmpDir,
        encoding: 'utf-8'
      }
    );

    assert.match(output, /Upstream change logged to/i);
    const changesFile = path.join(tmpDir, 'changes.md');
    assert.strictEqual(fs.existsSync(changesFile), true);
    const content = fs.readFileSync(changesFile, 'utf-8');
    assert.match(content, /Add gRPC streaming rule/);
    assert.match(content, /Category:\*\* Rule/);
    assert.match(content, /Support bidirectional streams/);
  });
});
