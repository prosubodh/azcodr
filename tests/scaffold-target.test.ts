import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { scaffold, validateTarget, getTemplateDir } from '../src/scaffold.js';

let tmpDir: string;
const templateDir = getTemplateDir();

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-test-'));
});

afterEach(() => {
  if (tmpDir && fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

describe('validateTarget rejects unsafe or non-empty targets', () => {
  test('validateTarget prevents copying into the template directory itself', () => {
    assert.throws(
      () => validateTarget(templateDir, { templateDir, force: true }),
      /Cannot scaffold into the azcodr template directory itself/
    );
  });

  test('validateTarget throws when target directory is not empty and force is false', () => {
    fs.writeFileSync(path.join(tmpDir, 'existing.txt'), 'content');
    assert.throws(
      () => validateTarget(tmpDir, { templateDir, force: false }),
      /Target directory is not empty/
    );
  });
});

describe('validateTarget prepares the target directory', () => {
  test('validateTarget allows non-empty target directory when force is true', () => {
    fs.writeFileSync(path.join(tmpDir, 'existing.txt'), 'content');
    assert.doesNotThrow(() => validateTarget(tmpDir, { templateDir, force: true }));
  });

  test('validateTarget creates target directory if it does not exist', () => {
    const nonExistent = path.join(tmpDir, 'nested', 'new-dir');
    validateTarget(nonExistent);
    assert.strictEqual(fs.existsSync(nonExistent), true);
  });

  test('validateTarget does not create target directory if dryRun is true', () => {
    const nonExistent = path.join(tmpDir, 'nested', 'dry-run-dir');
    validateTarget(nonExistent, { templateDir, force: false, dryRun: true });
    assert.strictEqual(fs.existsSync(nonExistent), false);
  });
});

describe('scaffold orchestration', () => {
  test('scaffold orchestrates full project initialization successfully', () => {
    const result = scaffold({ targetDir: tmpDir, force: true, noGit: false, silent: true });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.dryRun, false);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'AGENTS.md')), true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, '.editorconfig')), true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, '.git')), true);
    assert.strictEqual(result.actions.includes('git: initialize repository'), true);
  });

  test('scaffold handles dryRun mode without modifying disk or initializing git', () => {
    const dryRunDir = path.join(tmpDir, 'scaffold-dry-run');
    const result = scaffold({ targetDir: dryRunDir, force: false, noGit: false, dryRun: true });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.dryRun, true);
    assert.strictEqual(result.gitInitialized, true);
    assert.strictEqual(fs.existsSync(dryRunDir), false);
    assert.strictEqual(result.actions.some(a => a.includes('copy: AGENTS.md')), true);
    assert.strictEqual(result.actions.includes('git: initialize repository'), true);
  });

  test('scaffold supports default options', () => {
    const emptySub = path.join(tmpDir, 'empty-sub');
    fs.mkdirSync(emptySub);
    const origCwd = process.cwd;
    try {
      process.cwd = () => emptySub;
      const result = scaffold();
      assert.strictEqual(result.success, true);
    } finally {
      process.cwd = origCwd;
    }
  });
});
