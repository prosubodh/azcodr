const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { scaffold, validateTarget, copyTemplate, initGit, getTemplateDir } = require('../lib/scaffold.js');

describe('Scaffold Core Unit Tests', () => {
  let tmpDir;
  const templateDir = getTemplateDir();

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-test-'));
  });

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

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

  test('validateTarget allows non-empty target directory when force is true', () => {
    fs.writeFileSync(path.join(tmpDir, 'existing.txt'), 'content');
    assert.doesNotThrow(() => validateTarget(tmpDir, { templateDir, force: true }));
  });

  test('validateTarget creates target directory if it does not exist', () => {
    const nonExistent = path.join(tmpDir, 'nested', 'new-dir');
    validateTarget(nonExistent, { templateDir, force: false });
    assert.strictEqual(fs.existsSync(nonExistent), true);
  });

  test('copyTemplate copies essential template files', () => {
    copyTemplate(tmpDir, templateDir);

    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'AGENTS.md')), true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'memory.md')), true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'changes.md')), true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'README.md')), true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'docs', 'rules')), true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, '.agents', 'skills')), true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, '.gitignore')), true);
  });

  test('copyTemplate creates valid symlinks for CLAUDE.md and agents.md', () => {
    copyTemplate(tmpDir, templateDir);

    const claudePath = path.join(tmpDir, 'CLAUDE.md');
    const agentsLowerPath = path.join(tmpDir, 'agents.md');

    assert.strictEqual(fs.existsSync(claudePath), true);
    assert.strictEqual(fs.existsSync(agentsLowerPath), true);

    const claudeStat = fs.lstatSync(claudePath);
    const agentsLowerStat = fs.lstatSync(agentsLowerPath);

    assert.strictEqual(claudeStat.isSymbolicLink(), true);
    assert.strictEqual(agentsLowerStat.isSymbolicLink(), true);

    assert.strictEqual(fs.readlinkSync(claudePath), 'AGENTS.md');
    assert.strictEqual(fs.readlinkSync(agentsLowerPath), 'AGENTS.md');
  });

  test('copyTemplate sets executable permissions on all shell scripts', () => {
    copyTemplate(tmpDir, templateDir);

    const skillsDir = path.join(tmpDir, '.agents', 'skills');
    const skillFolders = fs.readdirSync(skillsDir);

    let scriptChecked = false;
    for (const folder of skillFolders) {
      const scriptDir = path.join(skillsDir, folder, 'scripts');
      if (fs.existsSync(scriptDir)) {
        const scripts = fs.readdirSync(scriptDir).filter(f => f.endsWith('.sh'));
        for (const script of scripts) {
          const scriptPath = path.join(scriptDir, script);
          const stat = fs.statSync(scriptPath);
          const isExecutable = (stat.mode & 0o111) !== 0;
          assert.strictEqual(isExecutable, true, `Script ${scriptPath} must be executable`);
          scriptChecked = true;
        }
      }
    }
    assert.strictEqual(scriptChecked, true, 'At least one shell script must be validated');
  });

  test('initGit initializes git when enabled and git binary is present', () => {
    initGit(tmpDir, { noGit: false });
    assert.strictEqual(fs.existsSync(path.join(tmpDir, '.git')), true);
  });

  test('initGit skips git initialization when noGit is true', () => {
    initGit(tmpDir, { noGit: true });
    assert.strictEqual(fs.existsSync(path.join(tmpDir, '.git')), false);
  });

  test('scaffold orchestrates full project initialization successfully', () => {
    const result = scaffold({
      targetDir: tmpDir,
      force: true,
      noGit: false,
      silent: true
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'AGENTS.md')), true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, '.git')), true);
  });

  test('ensureSymlink replaces existing symlink gracefully', () => {
    const { ensureSymlink } = require('../lib/scaffold.js');
    fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), '# Target');
    ensureSymlink(tmpDir, 'CLAUDE.md', 'AGENTS.md');
    // Call again to ensure replacing works without error
    ensureSymlink(tmpDir, 'CLAUDE.md', 'AGENTS.md');
    assert.strictEqual(fs.readlinkSync(path.join(tmpDir, 'CLAUDE.md')), 'AGENTS.md');
  });

  test('ensureSymlink falls back to copyFileSync when symlinkSync fails', () => {
    const { ensureSymlink } = require('../lib/scaffold.js');
    fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), '# Test Fallback');
    const origSymlinkSync = fs.symlinkSync;
    try {
      fs.symlinkSync = () => {
        throw new Error('EPERM: operation not permitted, symlink');
      };
      ensureSymlink(tmpDir, 'CLAUDE.md', 'AGENTS.md');
      assert.strictEqual(fs.existsSync(path.join(tmpDir, 'CLAUDE.md')), true);
      assert.strictEqual(fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf-8'), '# Test Fallback');
    } finally {
      fs.symlinkSync = origSymlinkSync;
    }
  });

  test('makeScriptsExecutable handles non-existent or empty skills directory gracefully', () => {
    const { makeScriptsExecutable } = require('../lib/scaffold.js');
    const emptyDir = path.join(tmpDir, 'empty');
    fs.mkdirSync(emptyDir);
    assert.doesNotThrow(() => makeScriptsExecutable(emptyDir));
  });

  test('initGit returns false when .git already exists', () => {
    fs.mkdirSync(path.join(tmpDir, '.git'));
    const initialized = initGit(tmpDir, { noGit: false });
    assert.strictEqual(initialized, false);
  });

  test('index.js exports scaffold and helper methods', () => {
    const api = require('../lib/index.js');
    assert.strictEqual(typeof api.scaffold, 'function');
    assert.strictEqual(typeof api.validateTarget, 'function');
    assert.strictEqual(typeof api.copyTemplate, 'function');
    assert.strictEqual(typeof api.logChange, 'function');
  });

  test('logChange throws when title is missing or empty', () => {
    const { logChange } = require('../lib/scaffold.js');
    assert.throws(() => logChange({ title: '' }), /A change title is required/);
    assert.throws(() => logChange({}), /A change title is required/);
  });

  test('logChange creates changes.md if not existing and logs entry', () => {
    const { logChange } = require('../lib/scaffold.js');
    const res = logChange({
      title: 'Add support for SQLite WAL mode',
      category: 'Database',
      targetFiles: 'docs/rules/database_transactions.md',
      rationale: 'Prevent database lockups under concurrent reads',
      description: 'Document SQLite WAL pragma invariant',
      targetDir: tmpDir
    });

    assert.strictEqual(res.success, true);
    const content = fs.readFileSync(path.join(tmpDir, 'changes.md'), 'utf-8');
    assert.match(content, /# Upstream Changes Ledger/);
    assert.match(content, /Add support for SQLite WAL mode/);
    assert.match(content, /Category:\*\* Database/);
    assert.match(content, /docs\/rules\/database_transactions\.md/);
  });

  test('logChange appends to existing changes.md with defaults', () => {
    const { logChange } = require('../lib/scaffold.js');
    fs.writeFileSync(path.join(tmpDir, 'changes.md'), '# Existing Header\n');

    const res = logChange({
      title: 'Generic Event Sourcing Pattern',
      targetDir: tmpDir
    });

    assert.strictEqual(res.success, true);
    const content = fs.readFileSync(path.join(tmpDir, 'changes.md'), 'utf-8');
    assert.match(content, /# Existing Header/);
    assert.match(content, /Generic Event Sourcing Pattern/);
    assert.match(content, /Category:\*\* Architecture/);
  });
});
