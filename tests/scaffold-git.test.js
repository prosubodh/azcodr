import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import childProcess from 'node:child_process';
import {
  isInsideGitWorkTree,
  initGit,
  getTemplateDir,
  runGit,
  assertInside
} from '../lib/scaffold.js';

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

describe('initGit basic initialization paths', () => {
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

  test('initGit returns false when .git already exists', () => {
    fs.mkdirSync(path.join(tmpDir, '.git'));
    const initialized = initGit(tmpDir, { noGit: false });
    assert.strictEqual(initialized, false);
  });
});

describe('initGit failure handling', () => {
  test('initGit returns false when child_process execFileSync fails', () => {
    const originalExecFileSync = childProcess.execFileSync;
    try {
      childProcess.execFileSync = () => {
        throw new Error('Command failed: git init');
      };
      const result = initGit(tmpDir, { noGit: false });
      assert.strictEqual(result, false);
    } finally {
      childProcess.execFileSync = originalExecFileSync;
    }
  });

  test('initGit handles complete commit failure gracefully', () => {
    const origExec = childProcess.execFileSync;
    try {
      childProcess.execFileSync = (file, args) => {
        const cmd = (args || []).join(' ');
        if (args[0] === 'rev-parse') return 'false\n';
        if (cmd.startsWith('commit') || cmd.startsWith('add')) throw new Error('git disk full');
        return '';
      };
      const result = initGit(tmpDir, { noGit: false });
      assert.strictEqual(result, true);
    } finally {
      childProcess.execFileSync = origExec;
    }
  });
});

describe('git work tree detection', () => {
  test('initGit returns false when target is already inside an existing git work tree', () => {
    // Inside a subdirectory of azcodr (no local .git, but inside git work tree)
    const subDir = path.join(templateDir, 'docs');
    const result = initGit(subDir, { noGit: false });
    assert.strictEqual(result, false);
  });

  test('isInsideGitWorkTree detects git repositories, non-existent directories, and command failures', () => {
    // Current workspace is a git work tree
    assert.strictEqual(isInsideGitWorkTree(templateDir), true);

    // Temp directory is not a git work tree
    assert.strictEqual(isInsideGitWorkTree(tmpDir), false);

    // Non-existent directory falls back to path.dirname
    const nonExistent = path.join(tmpDir, 'deep', 'does-not-exist');
    assert.strictEqual(isInsideGitWorkTree(nonExistent), false);

    // Error in execFileSync returns false
    const origExec = childProcess.execFileSync;
    try {
      childProcess.execFileSync = () => {
        throw new Error('git not found');
      };
      assert.strictEqual(isInsideGitWorkTree(templateDir), false);
    } finally {
      childProcess.execFileSync = origExec;
    }
  });
});

describe('initGit branch and commit fallbacks', () => {
  test('initGit handles branch main fallback, branch rename failures, and commit fallbacks', () => {
    const origExec = childProcess.execFileSync;
    const commandsRun = [];

    try {
      childProcess.execFileSync = (file, args, opts) => {
        commandsRun.push(`${file} ${(args || []).join(' ')}`);
        const cmd = (args || []).join(' ');
        if (args[0] === 'rev-parse') return 'false\n';
        if (cmd.startsWith('init -b main')) throw new Error('option -b not supported');
        if (cmd.startsWith('branch -m main')) throw new Error('branch rename failed');
        if (cmd.startsWith('commit')) {
          if (opts && opts.env && opts.env.GIT_AUTHOR_NAME === 'Subodh Khanal') {
            return '';
          }
          throw new Error('author identity unknown');
        }
        return '';
      };

      const result = initGit(tmpDir, { noGit: false });
      assert.strictEqual(result, true);
      assert.strictEqual(commandsRun.some(c => c.includes('init -q')), true);
      assert.strictEqual(commandsRun.some(c => c.includes('branch -m main')), true);
      assert.strictEqual(commandsRun.some(c => c.includes('commit')), true);
    } finally {
      childProcess.execFileSync = origExec;
    }
  });
});

describe('runGit allowlist validation', () => {
  test('runGit allowlist wrapper exists', () => {
    assert.strictEqual(typeof runGit, 'function');
  });

  test('runGit rejects empty argv', () => {
    assert.throws(() => runGit([]), /non-empty argv/);
  });

  test('runGit blocks non-allowlisted subcommand', () => {
    assert.throws(() => runGit(['rm', '-rf']), /Blocked git subcommand/);
  });

  test('runGit rejects non-array input', () => {
    assert.throws(() => runGit('rev-parse'), /non-empty argv/);
  });
});

describe('runGit delegation and assertInside boundaries', () => {
  test('runGit delegates to execFileSync without shell', () => {
    const orig = childProcess.execFileSync;
    try {
      let seen = null;
      childProcess.execFileSync = (file, args, opts) => {
        seen = { file, args, opts };
        return 'true\n';
      };
      const out = runGit(['rev-parse', '--is-inside-work-tree'], { cwd: tmpDir });
      assert.strictEqual(out, 'true\n');
      assert.strictEqual(seen.file, 'git');
      assert.strictEqual(seen.opts.shell, false);
    } finally {
      childProcess.execFileSync = orig;
    }
  });

  test('assertInside allows contained paths', () => {
    assert.doesNotThrow(() => assertInside(tmpDir, path.join(tmpDir, 'a', 'b.txt')));
  });

  test('assertInside blocks traversal with default message', () => {
    assert.throws(() => assertInside(tmpDir, '../escape.txt'), /escapes allowed root/);
  });

  test('assertInside honors custom message', () => {
    assert.throws(() => assertInside(tmpDir, '../escape.txt', 'custom boundary'), /custom boundary/);
  });
});
