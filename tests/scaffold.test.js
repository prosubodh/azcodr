const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const childProcess = require('node:child_process');
const {
  scaffold,
  validateTarget,
  copyTemplate,
  ensureSymlink,
  isSameCaseInsensitiveFile,
  makeScriptsExecutable,
  initGit,
  logChange,
  getTemplateDir,
  TEMPLATE_ITEMS
} = require('../lib/scaffold.js');

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

  test('validateTarget does not create target directory if dryRun is true', () => {
    const nonExistent = path.join(tmpDir, 'nested', 'dry-run-dir');
    validateTarget(nonExistent, { templateDir, force: false, dryRun: true });
    assert.strictEqual(fs.existsSync(nonExistent), false);
  });

  test('copyTemplate copies essential template files including .editorconfig', () => {
    copyTemplate(tmpDir, templateDir);

    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'AGENTS.md')), true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'memory.md')), true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'changes.md')), true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'README.md')), true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'docs', 'rules')), true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, '.agents', 'skills')), true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, '.gitignore')), true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, '.editorconfig')), true);
  });

  test('copyTemplate skips template items that do not exist in template directory', () => {
    const customTemplateDir = path.join(tmpDir, 'custom-tpl');
    fs.mkdirSync(customTemplateDir, { recursive: true });
    // Only create AGENTS.md, others are missing
    fs.writeFileSync(path.join(customTemplateDir, 'AGENTS.md'), '# Custom');

    const destDir = path.join(tmpDir, 'dest-dir');
    const actions = copyTemplate(destDir, customTemplateDir);

    assert.strictEqual(fs.existsSync(path.join(destDir, 'AGENTS.md')), true);
    assert.strictEqual(fs.existsSync(path.join(destDir, 'memory.md')), false);
    assert.strictEqual(actions.some(a => a.includes('AGENTS.md')), true);
  });

  test('copyTemplate supports dryRun mode without modifying destination', () => {
    const dryRunDest = path.join(tmpDir, 'non-existent-dest');
    const actions = copyTemplate(dryRunDest, templateDir, { dryRun: true });

    assert.strictEqual(fs.existsSync(dryRunDest), false);
    assert.strictEqual(actions.length > 0, true);
    assert.strictEqual(actions.some(a => a.includes('copy: AGENTS.md')), true);
    assert.strictEqual(actions.some(a => a.includes('copy: .editorconfig')), true);
    assert.strictEqual(actions.some(a => a.includes('symlink: CLAUDE.md')), true);
    assert.strictEqual(actions.some(a => a.includes('symlink: agents.md')), true);
  });

  test('copyTemplate creates valid symlinks for CLAUDE.md and agents.md', () => {
    copyTemplate(tmpDir, templateDir);

    const claudePath = path.join(tmpDir, 'CLAUDE.md');
    const agentsLowerPath = path.join(tmpDir, 'agents.md');

    assert.strictEqual(fs.existsSync(claudePath), true);
    assert.strictEqual(fs.existsSync(agentsLowerPath), true);

    const claudeStat = fs.lstatSync(claudePath);
    const agentsLowerStat = fs.lstatSync(agentsLowerPath);

    if (agentsLowerStat.isSymbolicLink()) {
      assert.strictEqual(fs.readlinkSync(agentsLowerPath), 'AGENTS.md');
    }

    if (claudeStat.isSymbolicLink()) {
      assert.strictEqual(fs.readlinkSync(claudePath), 'AGENTS.md');
    }
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
          if (process.platform !== 'win32') {
            const isExecutable = (stat.mode & 0o111) !== 0;
            assert.strictEqual(isExecutable, true, `Script ${scriptPath} must be executable`);
          }
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

  test('initGit simulates git initialization when dryRun is true', () => {
    const initialized = initGit(tmpDir, { noGit: false, dryRun: true });
    assert.strictEqual(initialized, true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, '.git')), false);
  });

  test('initGit returns false when child_process execSync fails', () => {
    const originalExecSync = childProcess.execSync;
    try {
      childProcess.execSync = () => {
        throw new Error('Command failed: git init');
      };
      const result = initGit(tmpDir, { noGit: false });
      assert.strictEqual(result, false);
    } finally {
      childProcess.execSync = originalExecSync;
    }
  });

  test('scaffold orchestrates full project initialization successfully', () => {
    const result = scaffold({
      targetDir: tmpDir,
      force: true,
      noGit: false,
      silent: true
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.dryRun, false);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'AGENTS.md')), true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, '.editorconfig')), true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, '.git')), true);
    assert.strictEqual(result.actions.includes('git: initialize repository'), true);
  });

  test('scaffold handles dryRun mode without modifying disk or initializing git', () => {
    const dryRunDir = path.join(tmpDir, 'scaffold-dry-run');
    const result = scaffold({
      targetDir: dryRunDir,
      force: false,
      noGit: false,
      dryRun: true
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.dryRun, true);
    assert.strictEqual(result.gitInitialized, true);
    assert.strictEqual(fs.existsSync(dryRunDir), false);
    assert.strictEqual(result.actions.some(a => a.includes('copy: AGENTS.md')), true);
    assert.strictEqual(result.actions.includes('git: initialize repository'), true);
  });

  test('ensureSymlink returns true immediately when dryRun is true', () => {
    const result = ensureSymlink(tmpDir, 'CLAUDE.md', 'AGENTS.md', true);
    assert.strictEqual(result, true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'CLAUDE.md')), false);
  });

  test('ensureSymlink replaces existing symlink gracefully', () => {
    fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), '# Target');
    ensureSymlink(tmpDir, 'CLAUDE.md', 'AGENTS.md');
    // Call again to ensure replacing works without error
    ensureSymlink(tmpDir, 'CLAUDE.md', 'AGENTS.md');
    assert.strictEqual(fs.readlinkSync(path.join(tmpDir, 'CLAUDE.md')), 'AGENTS.md');
  });

  test('ensureSymlink falls back to copyFileSync when symlinkSync fails', () => {
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

  test('isSameCaseInsensitiveFile accurately distinguishes case-insensitive files', () => {
    // 1. Different file names
    assert.strictEqual(isSameCaseInsensitiveFile(tmpDir, 'CLAUDE.md', 'AGENTS.md'), false);

    // 2. Matching names when files do not exist
    assert.strictEqual(isSameCaseInsensitiveFile(tmpDir, 'agents.md', 'AGENTS.md'), false);

    // 3. Target exists
    fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), '# Target');
    const isCaseInsensitiveFs = fs.existsSync(path.join(tmpDir, 'agents.md'));
    assert.strictEqual(
      isSameCaseInsensitiveFile(tmpDir, 'agents.md', 'AGENTS.md'),
      isCaseInsensitiveFs
    );

    // 4. Target exists, link exists as a symlink (case-sensitive system)
    ensureSymlink(tmpDir, 'CLAUDE.md', 'AGENTS.md');
    assert.strictEqual(isSameCaseInsensitiveFile(tmpDir, 'claude.md', 'CLAUDE.md'), false);

    // 5. Target exists and link exists as a regular file (simulating case-insensitive filesystem)
    if (!isCaseInsensitiveFs) {
      fs.writeFileSync(path.join(tmpDir, 'agents.md'), '# Target 2');
    }
    assert.strictEqual(isSameCaseInsensitiveFile(tmpDir, 'agents.md', 'AGENTS.md'), true);

    // 6. Error handling in try/catch
    const origLstatSync = fs.lstatSync;
    try {
      fs.lstatSync = () => { throw new Error('Simulated disk error'); };
      assert.strictEqual(isSameCaseInsensitiveFile(tmpDir, 'agents.md', 'AGENTS.md'), false);
    } finally {
      fs.lstatSync = origLstatSync;
    }
  });

  test('ensureSymlink preserves existing target file when on case-insensitive filesystem', () => {
    fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), '# Protected AGENTS.md');
    fs.writeFileSync(path.join(tmpDir, 'agents.md'), '# Protected AGENTS.md');
    const result = ensureSymlink(tmpDir, 'agents.md', 'AGENTS.md');
    assert.strictEqual(result, true);
    assert.strictEqual(fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf-8'), '# Protected AGENTS.md');
  });

  test('makeScriptsExecutable handles non-existent or empty skills directory gracefully', () => {
    const emptyDir = path.join(tmpDir, 'empty');
    fs.mkdirSync(emptyDir);
    assert.doesNotThrow(() => makeScriptsExecutable(emptyDir));
  });

  test('makeScriptsExecutable handles chmodSync exceptions gracefully', () => {
    const fakeSkillsDir = path.join(tmpDir, '.agents', 'skills', 'test-skill', 'scripts');
    fs.mkdirSync(fakeSkillsDir, { recursive: true });
    const fakeScript = path.join(fakeSkillsDir, 'test.sh');
    fs.writeFileSync(fakeScript, '#!/bin/sh\necho test\n');

    const origChmodSync = fs.chmodSync;
    try {
      fs.chmodSync = () => {
        throw new Error('EPERM: not permitted');
      };
      const modified = makeScriptsExecutable(tmpDir, false);
      assert.strictEqual(modified.length, 1);
    } finally {
      fs.chmodSync = origChmodSync;
    }
  });

  test('initGit returns false when .git already exists', () => {
    fs.mkdirSync(path.join(tmpDir, '.git'));
    const initialized = initGit(tmpDir, { noGit: false });
    assert.strictEqual(initialized, false);
  });

  test('index.js exports scaffold, constants, and helper methods', () => {
    const api = require('../lib/index.js');
    assert.strictEqual(typeof api.scaffold, 'function');
    assert.strictEqual(typeof api.validateTarget, 'function');
    assert.strictEqual(typeof api.copyTemplate, 'function');
    assert.strictEqual(typeof api.ensureSymlink, 'function');
    assert.strictEqual(typeof api.makeScriptsExecutable, 'function');
    assert.strictEqual(typeof api.initGit, 'function');
    assert.strictEqual(typeof api.getTemplateDir, 'function');
    assert.strictEqual(typeof api.logChange, 'function');
    assert.strictEqual(Array.isArray(api.TEMPLATE_ITEMS), true);
    assert.strictEqual(api.TEMPLATE_ITEMS.includes('.editorconfig'), true);
  });

  test('logChange throws when title is missing or empty', () => {
    assert.throws(() => logChange({ title: '' }), /A change title is required/);
    assert.throws(() => logChange({}), /A change title is required/);
  });

  test('logChange creates changes.md if not existing and logs entry', () => {
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
