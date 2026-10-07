/**
 * Guard against scaffolding into protected system locations.
 *
 * `azcodr ~ --force` and `azcodr / --force` must refuse even with --force.
 * Previously validateTarget allowed any non-empty directory when force was
 * true, so the filesystem root and the user's home directory were writable
 * targets. The first test below proved that hole (RED); the guard closed it.
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

describe('Protected target guard', () => {
  const templateDir = getTemplateDir();

  test('refuses the filesystem root even with force:true', () => {
    const root = path.parse(process.cwd()).root;
    assert.strictEqual(
      codeOf(() => validateTarget(root, { templateDir, force: true })),
      'E_TARGET_IS_PROTECTED'
    );
  });

  test('refuses the user home directory even with force:true', () => {
    const os = require('node:os');
    assert.strictEqual(
      codeOf(() => validateTarget(os.homedir(), { templateDir, force: true })),
      'E_TARGET_IS_PROTECTED'
    );
  });

  test('refuses the home directory parent (e.g. /home, C:\\Users)', () => {
    const os = require('node:os');
    const parent = path.dirname(path.resolve(os.homedir()));
    // The parent exists and is non-empty; without the guard, force:true would
    // allow scaffolding there and affect every user on the machine.
    assert.strictEqual(
      codeOf(() => validateTarget(parent, { templateDir, force: true })),
      'E_TARGET_IS_PROTECTED'
    );
  });

  test('refuses an ancestor of the template directory', () => {
    // Scaffolding into the template's own parent would merge the template
    // into its parent workspace (e.g. azcodr D:\projects --force).
    const parent = path.dirname(templateDir);
    assert.strictEqual(
      codeOf(() => validateTarget(parent, { templateDir, force: true })),
      'E_TARGET_IS_PROTECTED'
    );
  });

  test('refuses in dryRun mode too (a preview of destruction is still a refusal)', () => {
    const os = require('node:os');
    assert.strictEqual(
      codeOf(() => validateTarget(os.homedir(), { templateDir, force: true, dryRun: true })),
      'E_TARGET_IS_PROTECTED'
    );
  });

  test('allowProtected:true bypasses the guard for programmatic callers', () => {
    const os = require('node:os');
    // The CLI never passes this flag; it exists so tests and embedders can
    // exercise the path deliberately. Home exists and is non-empty, so with
    // force:true the only thing standing in the way is the guard itself.
    assert.strictEqual(
      isProtectedTarget(os.homedir(), { templateDir }),
      true,
      'precondition: home must be protected before testing the bypass'
    );
    assert.doesNotThrow(
      () => validateTarget(os.homedir(), { templateDir, force: true, allowProtected: true }),
      'allowProtected:true must bypass E_TARGET_IS_PROTECTED'
    );
  });

  test('a normal project subdirectory is not protected', () => {
    const os = require('node:os');
    const fs = require('node:fs');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-safe-'));
    try {
      assert.strictEqual(isProtectedTarget(dir, { templateDir }), false);
      // And validation passes for an empty safe directory.
      validateTarget(path.join(dir, 'new-project'), { templateDir, force: false });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('a home subdirectory (e.g. ~/my-project) is not protected', () => {
    const os = require('node:os');
    // Only home itself is blocked; projects inside home are the normal case.
    assert.strictEqual(
      isProtectedTarget(path.join(os.homedir(), 'my-project'), { templateDir }),
      false
    );
  });

  test('a symlink pointing at home is protected', () => {
    const os = require('node:os');
    const fs = require('node:fs');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-link-'));
    const link = path.join(dir, 'home-link');
    let created = false;
    try {
      fs.symlinkSync(os.homedir(), link, 'junction');
      created = true;
    } catch {
      return; // no symlink privilege on this host; skip rather than fake
    }
    try {
      assert.strictEqual(isProtectedTarget(link, { templateDir }), true);
      assert.strictEqual(
        codeOf(() => validateTarget(link, { templateDir, force: true })),
        'E_TARGET_IS_PROTECTED'
      );
    } finally {
      if (created) fs.rmSync(link, { force: true });
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('the error message tells the user what to do instead', () => {
    const os = require('node:os');
    try {
      validateTarget(os.homedir(), { templateDir, force: true });
      assert.fail('expected throw');
    } catch (e) {
      assert.strictEqual(e.code, 'E_TARGET_IS_PROTECTED');
      assert.match(e.message, /protected system directory/i);
      assert.match(e.message, /project subdirectory/i);
    }
  });

  test('a throwing os.homedir does not break the guard (lexical checks still run)', () => {
    const os = require('node:os');
    const path = require('node:path');
    const realHomedir = os.homedir;
    Object.defineProperty(os, 'homedir', {
      value: () => { throw new Error('no home'); },
      configurable: true,
      writable: true
    });
    try {
      // Root is caught lexically before home is ever consulted.
      assert.strictEqual(isProtectedTarget(path.parse(process.cwd()).root, { templateDir }), true);
      // A safe directory stays safe even when home is unknowable.
      const fs = require('node:fs');
      const dir = fs.mkdtempSync(path.join(realHomedir(), 'azcodr-nohome-'));
      try {
        assert.strictEqual(isProtectedTarget(dir, { templateDir }), false);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    } finally {
      Object.defineProperty(os, 'homedir', {
        value: realHomedir,
        configurable: true,
        writable: true
      });
    }
  });

  test('an unresolvable realpath does not break the guard', () => {
    const fs = require('node:fs');
    const realExists = fs.existsSync;
    const realRealpath = fs.realpathSync;
    Object.defineProperty(fs, 'existsSync', {
      value: (p) => (String(p).includes('ghost-target') ? true : realExists(p)),
      configurable: true,
      writable: true
    });
    Object.defineProperty(fs, 'realpathSync', {
      value: (p) => {
        if (String(p).includes('ghost-target')) {
          const e = new Error('ENOENT: race between stat and resolve');
          e.code = 'ENOENT';
          throw e;
        }
        return realRealpath(p);
      },
      configurable: true,
      writable: true
    });
    try {
      // Lexically safe, and the TOCTOU race in the realpath check degrades to
      // the lexical verdict instead of throwing.
      assert.strictEqual(
        isProtectedTarget('/ghost-target/azcodr-race', { templateDir }),
        false
      );
    } finally {
      Object.defineProperty(fs, 'existsSync', {
        value: realExists,
        configurable: true,
        writable: true
      });
      Object.defineProperty(fs, 'realpathSync', {
        value: realRealpath,
        configurable: true,
        writable: true
      });
    }
  });

  test('CLI refuses the home directory with --force and never scaffolds', async () => {
    const os = require('node:os');
    const { runCli } = require('../bin/azcodr.js');
    let called = false;
    const errors = [];
    let exitCode = null;
    const code = await runCli([os.homedir(), '--force'], {
      out: () => {},
      err: (m) => errors.push(m),
      exit: (c) => { exitCode = c; return c; },
      stdin: { isTTY: false },
      stdout: {},
      cwd: process.cwd(),
      templateDir,
      scaffold: () => { called = true; throw new Error('scaffold must not be called'); }
    });
    assert.strictEqual(code, 1);
    assert.strictEqual(exitCode, 1);
    assert.strictEqual(called, false, 'scaffold must never run for a protected target');
    assert.ok(errors.some((m) => /protected directory/i.test(m)), errors.join('\n'));
  });

  test('CLI refuses the filesystem root with --force and never scaffolds', async () => {
    const { runCli } = require('../bin/azcodr.js');
    let called = false;
    const errors = [];
    const code = await runCli([path.parse(process.cwd()).root, '--force'], {
      out: () => {},
      err: (m) => errors.push(m),
      exit: (c) => c,
      stdin: { isTTY: false },
      stdout: {},
      cwd: process.cwd(),
      templateDir,
      scaffold: () => { called = true; throw new Error('scaffold must not be called'); }
    });
    assert.strictEqual(code, 1);
    assert.strictEqual(called, false, 'scaffold must never run for a protected target');
    assert.ok(errors.some((m) => /protected directory/i.test(m)), errors.join('\n'));
  });
});
