/**
 * Error-code contract tests.
 *
 * typed-settings' lesson: consumers must branch on `error.code`, never on
 * message text, so a rewording never breaks their error handling. That only
 * holds if every throw site actually carries a stable machine-readable code.
 */
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const {
  runGit,
  assertInside,
  validateTarget,
  getTemplateDir
} = require('../lib/scaffold.js');

/** Every documented failure code, with the condition that must produce it. */
const EXPECTED_CODES = {
  E_TARGET_IS_TEMPLATE: 'scaffolding into the azcodr template directory itself',
  E_TARGET_NOT_EMPTY: 'target directory contains files and --force was not passed',
  E_GIT_ARGS_INVALID: 'runGit called without a non-empty argv array',
  E_GIT_BLOCKED: 'runGit called with a subcommand outside the allowlist',
  E_PATH_ESCAPE: 'a path resolved outside its allowed root'
};

function codeOf(fn) {
  try {
    fn();
  } catch (e) {
    assert.ok(e && e.code, `error must expose a machine-readable code, got: ${String(e && e.message)}`);
    return e.code;
  }
  assert.fail('expected the call to throw');
}

describe('Error contract: every throw site carries a stable code', () => {
  const templateDir = getTemplateDir();

  test('E_TARGET_IS_TEMPLATE', () => {
    assert.strictEqual(
      codeOf(() => validateTarget(templateDir, { templateDir, force: true })),
      'E_TARGET_IS_TEMPLATE'
    );
  });

  test('E_GIT_ARGS_INVALID', () => {
    assert.strictEqual(codeOf(() => runGit([])), 'E_GIT_ARGS_INVALID');
    assert.strictEqual(codeOf(() => runGit('init')), 'E_GIT_ARGS_INVALID');
    assert.strictEqual(codeOf(() => runGit(null)), 'E_GIT_ARGS_INVALID');
  });

  test('E_GIT_BLOCKED', () => {
    assert.strictEqual(codeOf(() => runGit(['push', '--force'])), 'E_GIT_BLOCKED');
    assert.strictEqual(codeOf(() => runGit(['rm', '-rf', '/'])), 'E_GIT_BLOCKED');
  });

  test('E_PATH_ESCAPE', () => {
    assert.strictEqual(codeOf(() => assertInside('/tmp/root', '../escape')), 'E_PATH_ESCAPE');
  });

  test('E_TARGET_NOT_EMPTY', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-code-'));
    try {
      fs.writeFileSync(path.join(dir, 'existing.txt'), 'x');
      assert.strictEqual(
        codeOf(() => validateTarget(dir, { templateDir, force: false })),
        'E_TARGET_NOT_EMPTY'
      );
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('every code named in this file is distinct', () => {
    const codes = Object.keys(EXPECTED_CODES);
    assert.strictEqual(new Set(codes).size, codes.length);
  });
});

describe('Error contract: messages stay human-readable', () => {
  test('each coded error still carries an actionable message', () => {
    try {
      runGit(['push']);
      assert.fail('expected throw');
    } catch (e) {
      assert.strictEqual(e.code, 'E_GIT_BLOCKED');
      assert.match(e.message, /Blocked git subcommand/);
      assert.match(e.message, /push/, 'message should name the offending subcommand');
    }
  });

  test('E_TARGET_NOT_EMPTY suggests the remedy (--force)', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-msg-'));
    try {
      fs.writeFileSync(path.join(dir, 'a.txt'), 'x');
      try {
        validateTarget(dir, { templateDir: getTemplateDir(), force: false });
        assert.fail('expected throw');
      } catch (e) {
        assert.strictEqual(e.code, 'E_TARGET_NOT_EMPTY');
        assert.match(e.message, /--force/, 'message must tell the user how to proceed');
      }
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('E_PATH_ESCAPE honors a caller-supplied message', () => {
    try {
      assertInside('/tmp/root', '../out', 'Template item must stay inside the template root');
      assert.fail('expected throw');
    } catch (e) {
      assert.strictEqual(e.code, 'E_PATH_ESCAPE');
      assert.strictEqual(e.message, 'Template item must stay inside the template root');
    }
  });
});