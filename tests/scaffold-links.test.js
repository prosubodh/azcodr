import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  ensureSymlink,
  ensureSymlinkOrPointer,
  isSameCaseInsensitiveFile,
  makeScriptsExecutable
} from '../lib/scaffold.js';

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-test-'));
});

afterEach(() => {
  if (tmpDir && fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

describe('ensureSymlink creates and replaces links', () => {
  test('ensureSymlink returns true immediately when dryRun is true', () => {
    const result = ensureSymlink({ targetDir: tmpDir, linkName: 'CLAUDE.md', targetFileName: 'AGENTS.md', dryRun: true });
    assert.strictEqual(result, true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'CLAUDE.md')), false);
  });

  test('ensureSymlink replaces existing symlink gracefully', () => {
    fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), '# Target');
    ensureSymlink({ targetDir: tmpDir, linkName: 'CLAUDE.md', targetFileName: 'AGENTS.md' });
    // Call again to ensure replacing works without error
    ensureSymlink({ targetDir: tmpDir, linkName: 'CLAUDE.md', targetFileName: 'AGENTS.md' });
    const claudePath = path.join(tmpDir, 'CLAUDE.md');
    const stat = fs.lstatSync(claudePath);
    if (stat.isSymbolicLink()) {
      assert.strictEqual(fs.readlinkSync(claudePath), 'AGENTS.md');
    } else {
      // Windows fallback without symlink privilege: verified as byte-identical copy
      assert.strictEqual(fs.readFileSync(claudePath, 'utf-8'), '# Target');
    }
  });
});

describe('ensureSymlink fallback behavior', () => {
  test('ensureSymlink falls back to copyFileSync when symlinkSync fails', () => {
    fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), '# Test Fallback');
    const origSymlinkSync = fs.symlinkSync;
    try {
      fs.symlinkSync = () => {
        throw new Error('EPERM: operation not permitted, symlink');
      };
      ensureSymlink({ targetDir: tmpDir, linkName: 'CLAUDE.md', targetFileName: 'AGENTS.md' });
      assert.strictEqual(fs.existsSync(path.join(tmpDir, 'CLAUDE.md')), true);
      assert.strictEqual(fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf-8'), '# Test Fallback');
    } finally {
      fs.symlinkSync = origSymlinkSync;
    }
  });

  test('ensureSymlink preserves existing target file when on case-insensitive filesystem', () => {
    fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), '# Protected AGENTS.md');
    fs.writeFileSync(path.join(tmpDir, 'agents.md'), '# Protected AGENTS.md');
    const result = ensureSymlink({ targetDir: tmpDir, linkName: 'agents.md', targetFileName: 'AGENTS.md' });
    assert.strictEqual(result, true);
    assert.strictEqual(fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf-8'), '# Protected AGENTS.md');
  });
});

describe('isSameCaseInsensitiveFile distinguishes files', () => {
  test('isSameCaseInsensitiveFile accurately distinguishes case-insensitive files', () => {
    assert.strictEqual(isSameCaseInsensitiveFile(tmpDir, 'CLAUDE.md', 'AGENTS.md'), false);

    assert.strictEqual(isSameCaseInsensitiveFile(tmpDir, 'agents.md', 'AGENTS.md'), false);

    fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), '# Target');
    const isCaseInsensitiveFs = fs.existsSync(path.join(tmpDir, 'agents.md'));
    assert.strictEqual(
      isSameCaseInsensitiveFile(tmpDir, 'agents.md', 'AGENTS.md'),
      isCaseInsensitiveFs
    );

    // On case-insensitive filesystems (Windows/macOS) claude.md collides with CLAUDE.md.
    ensureSymlink({ targetDir: tmpDir, linkName: 'CLAUDE.md', targetFileName: 'AGENTS.md' });
    assert.strictEqual(
      isSameCaseInsensitiveFile(tmpDir, 'claude.md', 'CLAUDE.md'),
      isCaseInsensitiveFs
    );

    if (!isCaseInsensitiveFs) {
      fs.writeFileSync(path.join(tmpDir, 'agents.md'), '# Target 2');
    }
    assert.strictEqual(isSameCaseInsensitiveFile(tmpDir, 'agents.md', 'AGENTS.md'), true);

    const origLstatSync = fs.lstatSync;
    try {
      fs.lstatSync = () => { throw new Error('Simulated disk error'); };
      assert.strictEqual(isSameCaseInsensitiveFile(tmpDir, 'agents.md', 'AGENTS.md'), false);
    } finally {
      fs.lstatSync = origLstatSync;
    }
  });
});

describe('makeScriptsExecutable tolerates missing directories', () => {
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
});

describe('makeScriptsExecutable covers agent scripts', () => {
  test('makeScriptsExecutable handles agent scripts chmodSync exceptions gracefully', () => {
    const fakeAgentDir = path.join(tmpDir, '.agents', 'scripts');
    fs.mkdirSync(fakeAgentDir, { recursive: true });
    const fakeScript = path.join(fakeAgentDir, 'hook.sh');
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

  test('isSameCaseInsensitiveFile returns true for identical names and false on readdir failure', () => {
    assert.strictEqual(isSameCaseInsensitiveFile(tmpDir, 'AGENTS.md', 'AGENTS.md'), true);
    const origReaddir = fs.readdirSync;
    try {
      fs.readdirSync = () => { throw new Error('disk error'); };
      assert.strictEqual(isSameCaseInsensitiveFile(tmpDir, 'agents.md', 'AGENTS.md'), false);
    } finally {
      fs.readdirSync = origReaddir;
    }
  });
});

describe('ensureSymlinkOrPointer pointer fallback', () => {
  test('ensureSymlinkOrPointer creates symlink or text pointer fallback', () => {
    assert.strictEqual(ensureSymlinkOrPointer({ targetDir: tmpDir, linkName: 'ptr.md', targetFileName: '../AGENTS.md', dryRun: true }), true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'ptr.md')), false);
    fs.writeFileSync(path.join(tmpDir, 'ptr.md'), '../AGENTS.md\n');
    assert.strictEqual(ensureSymlinkOrPointer({ targetDir: tmpDir, linkName: 'ptr.md', targetFileName: '../AGENTS.md' }), true);
    assert.strictEqual(fs.readFileSync(path.join(tmpDir, 'ptr.md'), 'utf-8').trim(), '../AGENTS.md');
    fs.writeFileSync(path.join(tmpDir, 'stale.md'), 'stale content');
    assert.strictEqual(ensureSymlinkOrPointer({ targetDir: tmpDir, linkName: 'stale.md', targetFileName: '../AGENTS.md' }), true);
    const staleStat = fs.lstatSync(path.join(tmpDir, 'stale.md'));
    if (staleStat.isSymbolicLink()) {
      assert.strictEqual(fs.readlinkSync(path.join(tmpDir, 'stale.md')).replace(/\\/g, '/'), '../AGENTS.md'); // readlink may return backslash separators on Windows runners
    } else {
      assert.strictEqual(fs.readFileSync(path.join(tmpDir, 'stale.md'), 'utf-8').trim(), '../AGENTS.md');
    }
    const origSymlink = fs.symlinkSync;
    try {
      fs.symlinkSync = () => { throw new Error('EPERM'); };
      assert.strictEqual(ensureSymlinkOrPointer({ targetDir: tmpDir, linkName: 'fallback.md', targetFileName: '../AGENTS.md' }), true);
      assert.strictEqual(fs.readFileSync(path.join(tmpDir, 'fallback.md'), 'utf-8').trim(), '../AGENTS.md');
    } finally {
      fs.symlinkSync = origSymlink;
    }
  });
});

describe('isSameCaseInsensitiveFile edge cases', () => {
  test('isSameCaseInsensitiveFile returns false when entries vanish before stat', () => {
    const origReaddir = fs.readdirSync;
    const origExists = fs.existsSync;
    try {
      fs.readdirSync = () => ['AGENTS.md', 'agents.md'];
      fs.existsSync = () => false;
      assert.strictEqual(isSameCaseInsensitiveFile(tmpDir, 'agents.md', 'AGENTS.md'), false);
    } finally {
      fs.readdirSync = origReaddir;
      fs.existsSync = origExists;
    }
  });

  test('isSameCaseInsensitiveFile covers case-insensitive collision branch', () => {
    // Deterministically simulate a case-insensitive filesystem on any platform (lines 83-88 cover agents.md).
    const origReaddir = fs.readdirSync;
    const origExists = fs.existsSync;
    const origLstat = fs.lstatSync;
    try {
      fs.readdirSync = () => ['AGENTS.md'];
      fs.existsSync = () => true;
      fs.lstatSync = () => ({ isSymbolicLink: () => false });
      assert.strictEqual(isSameCaseInsensitiveFile(tmpDir, 'agents.md', 'AGENTS.md'), true);
    } finally {
      fs.readdirSync = origReaddir;
      fs.existsSync = origExists;
      fs.lstatSync = origLstat;
    }
  });
});

describe('isSameCaseInsensitiveFile both-spellings listing', () => {
  test('detects both spellings present and unlinked', () => {
    // A case-sensitive host holding both spellings as regular files: the
    // listing contains both entries, neither is a symlink, so they collide.
    // This covers the both-entries-exist path on hosts (like Windows) where
    // two casings cannot naturally coexist.
    const origReaddir = fs.readdirSync;
    const origLstat = fs.lstatSync;
    try {
      fs.readdirSync = () => ['AGENTS.md', 'agents.md'];
      fs.lstatSync = () => ({ isSymbolicLink: () => false });
      assert.strictEqual(isSameCaseInsensitiveFile(tmpDir, 'agents.md', 'AGENTS.md'), true);
    } finally {
      fs.readdirSync = origReaddir;
      fs.lstatSync = origLstat;
    }
  });

  test('reports collision without depending on host case semantics', () => {
    const origReaddir = fs.readdirSync;
    const origLstat = fs.lstatSync;
    try {
      fs.readdirSync = () => ['AGENTS.md', 'agents.md'];
      fs.lstatSync = () => ({ isSymbolicLink: () => true });
      assert.strictEqual(isSameCaseInsensitiveFile(tmpDir, 'agents.md', 'AGENTS.md'), false);
    } finally {
      fs.readdirSync = origReaddir;
      fs.lstatSync = origLstat;
    }
  });
});

describe('ensureSymlinkOrPointer dangling and missing sources', () => {
  test('ensureSymlinkOrPointer handles dangling symlink probe', () => {
    const dangling = path.join(tmpDir, 'dangling.md');
    try {
      fs.symlinkSync('non-existent-target.md', dangling, 'file');
    } catch {
      fs.writeFileSync(dangling, 'placeholder');
      const origExists = fs.existsSync;
      try {
        fs.existsSync = (p) => (p === dangling ? false : origExists(p));
        assert.strictEqual(ensureSymlinkOrPointer({ targetDir: tmpDir, linkName: 'dangling.md', targetFileName: '../AGENTS.md' }), true);
      } finally {
        fs.existsSync = origExists;
      }
      return;
    }
    assert.strictEqual(ensureSymlinkOrPointer({ targetDir: tmpDir, linkName: 'dangling.md', targetFileName: '../AGENTS.md' }), true);
  });

  test('ensureSymlink handles missing source without copy fallback', () => {
    const origSymlink = fs.symlinkSync;
    try {
      fs.symlinkSync = () => { throw new Error('EPERM'); };
      assert.strictEqual(ensureSymlink({ targetDir: tmpDir, linkName: 'ghost.md', targetFileName: 'no-such-source.md' }), true);
      assert.strictEqual(fs.existsSync(path.join(tmpDir, 'ghost.md')), false);
    } finally {
      fs.symlinkSync = origSymlink;
    }
  });
});
