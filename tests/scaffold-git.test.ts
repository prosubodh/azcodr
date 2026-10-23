import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import childProcess from 'node:child_process';
import {
  isInsideGitWorkTree,
  initGit,
  installPrePushHook,
  scaffold,
  getTemplateDir,
  runGit,
  assertInside
} from '../src/scaffold.js';

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

describe('initGit basic initialization paths', () => {
  test('initGit initializes git when enabled and git binary is present', () => {
    initGit(tmpDir);
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
      (childProcess as any).execFileSync = (file: any, args: any) => {
        const cmd = (args || []).join(' ');
        if (args && args[0] === 'rev-parse') return 'false\n';
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
    const commandsRun: string[] = [];

    try {
      (childProcess as any).execFileSync = (file: any, args: any, opts: any) => {
        commandsRun.push(`${file} ${(args || []).join(' ')}`);
        const cmd = (args || []).join(' ');
        if (args && args[0] === 'rev-parse') return 'false\n';
        if (cmd.startsWith('init -b main')) throw new Error('option -b not supported');
        if (cmd.startsWith('branch -m main')) throw new Error('branch rename failed');
        if (cmd.startsWith('commit')) {
          if (opts && opts.env && opts.env.GIT_AUTHOR_NAME === 'azcodr[bot]') {
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
    assert.throws(() => runGit('rev-parse' as any), /non-empty argv/);
  });
});

describe('runGit delegation and assertInside boundaries', () => {
  test('runGit delegates to execFileSync without shell', () => {
    const orig = childProcess.execFileSync;
    try {
      let seen: any = null;
      (childProcess as any).execFileSync = (file: any, args: any, opts: any) => {
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

describe('installPrePushHook: automated branch protection hook installation', () => {
  test('returns installed: false when no .git directory exists', () => {
    const res = installPrePushHook(tmpDir);
    assert.strictEqual(res.installed, false);
    assert.match(res.reason ?? '', /No \.git directory found/);
  });

  test('installs pre-push hook into .git/hooks/pre-push when .git exists', () => {
    fs.mkdirSync(path.join(tmpDir, '.git'));
    const res = installPrePushHook(tmpDir);
    assert.strictEqual(res.installed, true);
    assert.ok(res.action?.includes('install: .git/hooks/pre-push'));

    const hookFile = path.join(tmpDir, '.git', 'hooks', 'pre-push');
    assert.ok(fs.existsSync(hookFile));
    const content = fs.readFileSync(hookFile, 'utf-8');
    assert.ok(content.includes('azcodr generic law'));
  });

  test('dryRun records action without creating file on disk', () => {
    fs.mkdirSync(path.join(tmpDir, '.git'));
    const res = installPrePushHook(tmpDir, { dryRun: true });
    assert.strictEqual(res.installed, true);
    assert.ok(res.action?.includes('install: .git/hooks/pre-push'));
    assert.strictEqual(fs.existsSync(path.join(tmpDir, '.git', 'hooks', 'pre-push')), false);
  });

  test('skips overwrite of custom pre-push hook unless force is true', () => {
    const hooksDir = path.join(tmpDir, '.git', 'hooks');
    fs.mkdirSync(hooksDir, { recursive: true });
    const hookFile = path.join(hooksDir, 'pre-push');
    fs.writeFileSync(hookFile, '#!/bin/sh\necho "custom"\n', 'utf-8');

    const res = installPrePushHook(tmpDir, { force: false });
    assert.strictEqual(res.installed, false);
    assert.match(res.reason ?? '', /Custom pre-push hook already exists/);
    assert.strictEqual(fs.readFileSync(hookFile, 'utf-8'), '#!/bin/sh\necho "custom"\n');

    const forceRes = installPrePushHook(tmpDir, { force: true });
    assert.strictEqual(forceRes.installed, true);
    assert.ok(fs.readFileSync(hookFile, 'utf-8').includes('azcodr generic law'));
  });

  test('detects already-installed azcodr pre-push hook without re-installing', () => {
    fs.mkdirSync(path.join(tmpDir, '.git'));
    installPrePushHook(tmpDir);
    const second = installPrePushHook(tmpDir);
    assert.strictEqual(second.installed, false);
    assert.match(second.reason ?? '', /azcodr pre-push hook already installed/);
  });

  test('scaffold automatically installs pre-push hook when git is initialized', () => {
    const res = scaffold({ targetDir: tmpDir, force: true });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.gitInitialized, true);
    assert.ok(res.actions.some((a) => a.includes('install: .git/hooks/pre-push')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.git', 'hooks', 'pre-push')));
  });
});
