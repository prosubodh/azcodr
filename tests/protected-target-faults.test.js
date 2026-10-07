/**
 * Adversarial cases for the protected-target guard.
 *
 * Symlink aliases, throwing host APIs, and TOCTOU races: the guard must fall
 * back to its lexical verdict, never throw, and never allow.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

import { validateTarget, getTemplateDir, isProtectedTarget } from '../lib/scaffold.js';

function codeOf(fn) {
  try {
    fn();
  } catch (e) {
    assert.ok(e && e.code, `error must expose a machine-readable code, got: ${String(e && e.message)}`);
    return e.code;
  }
  assert.fail('expected the call to throw');
}

function override(obj, name, impl) {
  const original = obj[name];
  Object.defineProperty(obj, name, { value: impl, configurable: true, writable: true });
  return () => Object.defineProperty(obj, name, { value: original, configurable: true, writable: true });
}

function fakeHomeLink(dir, home) {
  const link = path.join(dir, 'home-link');
  fs.symlinkSync(home, link, 'junction');
  return link;
}

function createHomeLink(home) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-link-'));
  try {
    return { dir, link: fakeHomeLink(dir, home) };
  } catch {
    fs.rmSync(dir, { recursive: true, force: true });
    return null;
  }
}

function destroyHomeLink(handle) {
  fs.rmSync(handle.link, { force: true });
  fs.rmSync(handle.dir, { recursive: true, force: true });
}

describe('Protected target guard: symlink aliases', () => {
  const templateDir = getTemplateDir();

  test('a symlink pointing at home is protected', () => {
    const handle = createHomeLink(os.homedir());
    if (handle === null) return; // no symlink privilege on this host; skip rather than fake
    try {
      assert.strictEqual(isProtectedTarget(handle.link, { templateDir }), true);
      const code = codeOf(() => validateTarget(handle.link, { templateDir, force: true }));
      assert.strictEqual(code, 'E_TARGET_IS_PROTECTED');
    } finally {
      destroyHomeLink(handle);
    }
  });
});

function withTempDir(prefix, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  try {
    fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function installGhostRace() {
  const realExists = fs.existsSync;
  const realRealpath = fs.realpathSync;
  const restoreExists = override(fs, 'existsSync', (p) => (
    String(p).includes('ghost-target') ? true : realExists(p)
  ));
  const restoreRealpath = override(fs, 'realpathSync', (p, ...rest) => {
    if (String(p).includes('ghost-target')) {
      const err = new Error('ENOENT: race between stat and resolve');
      err.code = 'ENOENT';
      throw err;
    }
    return realRealpath(p, ...rest);
  });
  return [restoreExists, restoreRealpath];
}

describe('Protected target guard: degraded host APIs', () => {
  const templateDir = getTemplateDir();

  test('a throwing os.homedir degrades to the lexical verdict', () => {
    const restore = override(os, 'homedir', () => { throw new Error('no home'); });
    try {
      assert.strictEqual(isProtectedTarget(path.parse(process.cwd()).root, { templateDir }), true);
      withTempDir('azcodr-nohome-', (dir) => {
        assert.strictEqual(isProtectedTarget(dir, { templateDir }), false);
      });
    } finally {
      restore();
    }
  });

  test('a realpath race degrades to the lexical verdict', () => {
    const restores = installGhostRace();
    try {
      assert.strictEqual(isProtectedTarget('/ghost-target/azcodr-race', { templateDir }), false);
    } finally {
      restores.forEach((restore) => restore());
    }
  });
});
