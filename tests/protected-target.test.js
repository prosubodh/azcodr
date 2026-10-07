/**
 * Guard against scaffolding into protected system locations.
 *
 * `azcodr ~ --force` and `azcodr / --force` must refuse even with --force.
 * The first tests below proved that hole (RED); the guard closed it. Fault
 * injection cases live in protected-target-faults.test.js.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { validateTarget, getTemplateDir, isProtectedTarget } = require('../lib/scaffold.js');

function codeOf(fn) {
  try {
    fn();
  } catch (e) {
    assert.ok(e && e.code, `error must expose a machine-readable code, got: ${String(e && e.message)}`);
    return e.code;
  }
  assert.fail('expected the call to throw');
}

function assertProtected(targetDir, options = {}) {
  const templateDir = getTemplateDir();
  assert.strictEqual(
    codeOf(() => validateTarget(targetDir, { templateDir, force: true, ...options })),
    'E_TARGET_IS_PROTECTED'
  );
}

function mockCliIo(templateDir) {
  const state = { called: false, errors: [], exitCode: null };
  const io = {
    out: () => {},
    err: (m) => state.errors.push(m),
    exit: (c) => { state.exitCode = c; return c; },
    stdin: { isTTY: false },
    stdout: {},
    cwd: process.cwd(),
    templateDir,
    scaffold: () => { state.called = true; throw new Error('scaffold must not be called'); }
  };
  return { io, state };
}

async function assertCliRefuses(target) {
  const { runCli } = require('../bin/azcodr.js');
  const { io, state } = mockCliIo(getTemplateDir());
  const code = await runCli([target, '--force'], io);
  assert.strictEqual(code, 1);
  assert.strictEqual(state.exitCode, 1);
  assert.strictEqual(state.called, false, 'scaffold must never run for a protected target');
  assert.ok(state.errors.some((m) => /protected directory/i.test(m)), state.errors.join('\n'));
}

describe('Protected target guard: refusals', () => {
  const templateDir = getTemplateDir();

  test('refuses the filesystem root even with force:true', () => {
    assertProtected(path.parse(process.cwd()).root);
  });

  test('refuses the user home directory even with force:true', () => {
    assertProtected(require('node:os').homedir());
  });

  test('refuses the home directory parent (e.g. /home, C:\\Users)', () => {
    const os = require('node:os');
    assertProtected(path.dirname(path.resolve(os.homedir())));
  });

  test('refuses an ancestor of the template directory', () => {
    assertProtected(path.dirname(templateDir));
  });

  test('refuses in dryRun mode too', () => {
    assertProtected(require('node:os').homedir(), { dryRun: true });
  });
});

describe('Protected target guard: escape hatch and messages', () => {
  const templateDir = getTemplateDir();

  test('allowProtected:true bypasses the guard for programmatic callers', () => {
    const os = require('node:os');
    assert.strictEqual(isProtectedTarget(os.homedir(), { templateDir }), true);
    assert.doesNotThrow(
      () => validateTarget(os.homedir(), { templateDir, force: true, allowProtected: true })
    );
  });

  test('the error message tells the user what to do instead', () => {
    try {
      validateTarget(require('node:os').homedir(), { templateDir, force: true });
      assert.fail('expected throw');
    } catch (e) {
      assert.strictEqual(e.code, 'E_TARGET_IS_PROTECTED');
      assert.match(e.message, /protected system directory/i);
      assert.match(e.message, /project subdirectory/i);
    }
  });
});

describe('Protected target guard: safe paths stay open', () => {
  const templateDir = getTemplateDir();

  test('a normal project subdirectory is not protected', () => {
    const os = require('node:os');
    const fs = require('node:fs');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-safe-'));
    try {
      assert.strictEqual(isProtectedTarget(dir, { templateDir }), false);
      validateTarget(path.join(dir, 'new-project'), { templateDir, force: false });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('a home subdirectory (e.g. ~/my-project) is not protected', () => {
    const os = require('node:os');
    assert.strictEqual(isProtectedTarget(path.join(os.homedir(), 'my-project'), { templateDir }), false);
  });
});

describe('Protected target guard: CLI fails fast', () => {
  test('CLI refuses the home directory with --force and never scaffolds', async () => {
    await assertCliRefuses(require('node:os').homedir());
  });

  test('CLI refuses the filesystem root with --force and never scaffolds', async () => {
    await assertCliRefuses(path.parse(process.cwd()).root);
  });
});
