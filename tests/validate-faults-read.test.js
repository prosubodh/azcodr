/**
 * Filesystem-fault tests for validator reads.
 *
 * Split from tests/validate-faults.test.js: read-fault paths that must report
 * a failure rather than degrade into a pass.
 */
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const validatePath = path.resolve(__dirname, '..', 'scripts', 'validate.js');

/**
 * Runs the validator against a fixture with `node:fs` fault injection.
 * Real subprocess (not require) so the mock applies to the module's own
 * fs reference, exactly as it would in a broken environment.
 */
function runWithFaults(root, patch) {
  const harness = path.join(root, '__fault_harness.js');
  fs.writeFileSync(harness, `
    const fs = require('node:fs');
    const orig = {};
    for (const name of Object.keys(${patch})) orig[name] = fs[name];
    // Node exposes some fs bindings as getter-only properties, so a blanket
    // Object.assign throws. Wrap each patched function individually.
    const overrides = ${patch};
    for (const [name, impl] of Object.entries(overrides)) {
      Object.defineProperty(fs, name, { value: impl, configurable: true, writable: true });
    }
    const validator = require(${JSON.stringify(validatePath)});
    const lines = [];
    const reporter = {
      pass: (m) => lines.push('PASS ' + m),
      warn: (m) => lines.push('WARN ' + m),
      fail: (m) => lines.push('FAIL ' + m),
      log: () => {},
      heading: () => {}
    };
    const result = validator.runValidation(${JSON.stringify(root)}, reporter);
    console.log(JSON.stringify({ result, lines }));
  `);
  const { execFileSync } = require('node:child_process');
  const out = execFileSync(process.execPath, [harness], { encoding: 'utf-8' });
  fs.rmSync(harness, { force: true });
  return JSON.parse(out);
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-fault-'));
  fs.writeFileSync(path.join(root, 'AGENTS.md'), '# A\n');
  for (const n of ['CLAUDE.md', 'GEMINI.md', '.cursorrules', '.windsurfrules']) {
    fs.writeFileSync(path.join(root, n), 'AGENTS.md\n');
  }
  fs.writeFileSync(path.join(root, '.gitignore'), 'x\n');
  // Full skeleton so injected readdir faults actually reach the listing calls
  // rather than short-circuiting on a missing-directory existsSync check.
  fs.mkdirSync(path.join(root, 'docs', 'rules'), { recursive: true });
  fs.mkdirSync(path.join(root, '.agents', 'skills', 'demo'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs', 'rules', 'r.md'), '# R\n\n> **Core Mandate:** x\n');
  fs.writeFileSync(
    path.join(root, '.agents', 'skills', 'demo', 'SKILL.md'),
    '---\nname: demo\ndescription: Use when x. Do not use y.\n---\n\n## Gotchas\n'
  );
  fs.writeFileSync(path.join(root, 'memory.md'), '# Memory\n');
  return root;
}

/** In-process validation of `root`, returning the reporter lines. */
function collectDirect(root) {
  const lines = [];
  const { runValidation } = require('../scripts/validate.js');
  runValidation(root, {
    pass: (m) => lines.push(`PASS ${m}`),
    warn: (m) => lines.push(`WARN ${m}`),
    fail: (m) => lines.push(`FAIL ${m}`),
    log: () => {},
    heading: () => {}
  });
  return { lines, joined: lines.join('\n') };
}

let root;
beforeEach(() => { root = fixture(); });
afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

describe('break: readlink faults are reported', () => {
  test('readlink failure is reported, not treated as a valid pointer', () => {
    // This host cannot create real symlinks (EPERM), so pretend lstat sees
    // one and make readlink fail — the dangling-link path under test.
    const { lines } = runWithFaults(root, `{
      lstatSync: (p, ...rest) => {
        const st = orig.lstatSync(p, ...rest);
        if (String(p).includes('CLAUDE.md')) {
          return { isSymbolicLink: () => true, isFile: () => false, isDirectory: () => false };
        }
        return st;
      },
      readlinkSync: () => { throw new Error('EPERM: simulated dangling link'); }
    }`);
    const readlinkFailure = lines.filter((l) => /readlink failed: EPERM/.test(l));
    assert.ok(readlinkFailure.length > 0, `expected a readlink failure report: ${lines.join(' | ')}`);
    // Critically: no parity file may be reported as a valid symlink.
    assert.ok(!lines.some((l) => /valid symlink to AGENTS\.md/.test(l)), lines.join(' | '));
  });
});

describe('break: parity file read faults are reported', () => {
  test('readFileSync failure on a parity file is reported', () => {
    const target = path.join(root, 'CLAUDE.md').replace(/\\/g, '\\\\');
    const { lines } = runWithFaults(root, `{
      readFileSync: (p, ...rest) => {
        if (String(p).includes('CLAUDE.md')) throw new Error('EACCES: simulated');
        return orig.readFileSync(p, ...rest);
      }
    }`);
    assert.ok(
      lines.some((l) => /CLAUDE\.md could not be read: EACCES/.test(l)),
      `expected a read-failure report for CLAUDE.md: ${lines.join(' | ')}`
    );
    void target;
  });
});

describe('break: unreadable markdown does not abort the run', () => {
  test('an unreadable markdown file is reported without aborting the run', () => {
    // Regression: phase 4 previously crashed the whole validator on a single
    // unreadable file, so no later phase ever ran.
    fs.writeFileSync(path.join(root, 'LOCKED.md'), '[x](./nope.md)\n');
    const { result, lines } = runWithFaults(root, `{
      readFileSync: (p, ...rest) => {
        if (String(p).includes('LOCKED.md')) throw new Error('EACCES: simulated locked file');
        return orig.readFileSync(p, ...rest);
      }
    }`);
    assert.ok(
      lines.some((l) => /Could not read markdown file LOCKED\.md: EACCES/.test(l)),
      `expected an unreadable-file report: ${lines.join(' | ')}`
    );
    // The run must complete: later phases still report.
    assert.ok(
      lines.some((l) => /memory\.md/.test(l)),
      `phase 5 should still run after a phase-4 read fault: ${lines.join(' | ')}`
    );
    assert.ok(result.errors > 0);
  });
});

describe('break: unreadable ledger and root listings', () => {
  test('an unreadable memory.md is reported and later phases still run', () => {
    // A permissions error on the ADR ledger previously threw out of
    // runValidation, skipping phase 6 entirely.
    const { result, lines } = runWithFaults(root, `{
      readFileSync: (p, ...rest) => {
        if (String(p).includes('memory.md')) throw new Error('EACCES: simulated');
        return orig.readFileSync(p, ...rest);
      }
    }`);
    assert.ok(
      lines.some((l) => /Could not read memory\.md: EACCES/.test(l)),
      `expected a memory.md read failure: ${lines.join(' | ')}`
    );
    assert.ok(result.errors > 0);
  });

  test('an unreadable root still produces a non-zero error count', () => {
    // Remove AGENTS.md so the root is already invalid, then make the listing
    // unreadable: the run must not silently pass.
    fs.rmSync(path.join(root, 'AGENTS.md'));
    const { result } = runWithFaults(root, `{
      readdirSync: () => { throw new Error('EPERM: simulated unreadable root'); }
    }`);
    assert.ok(result.errors > 0, 'an unreadable root must not validate clean');
  });
});

describe('break: unreadable AGENTS file', () => {
  test('an unreadable AGENTS.md is reported and later phases still run', () => {
    const { result, lines } = runWithFaults(root, `{
      readFileSync: (p, ...rest) => {
        if (String(p).includes('AGENTS.md')) throw new Error('EACCES: simulated');
        return orig.readFileSync(p, ...rest);
      }
    }`);
    assert.ok(
      lines.some((l) => /Could not read AGENTS\.md: EACCES/.test(l)),
      `expected an AGENTS.md read failure: ${lines.join(' | ')}`
    );
    assert.ok(result.errors > 0);
    // The run must complete rather than abort at phase 1.
    assert.ok(
      lines.some((l) => /Validated \d+ modular rule files/.test(l)),
      `later phases should still execute: ${lines.join(' | ')}`
    );
  });
});

describe('break: unreadable skills listing', () => {
  test('an unreadable skills directory is reported, not thrown', () => {
    // readSkillFolders previously called statSync unguarded, so a permissions
    // error or a broken symlink took down every later phase with a stack trace.
    const { result, lines } = runWithFaults(root, `{
      readdirSync: (p, ...rest) => {
        if (String(p).includes('skills')) throw new Error('EACCES: simulated');
        return orig.readdirSync(p, ...rest);
      }
    }`);
    assert.ok(
      lines.some((l) => /Could not list skills directory: EACCES/.test(l)),
      `expected a skills-listing failure report: ${lines.join(' | ')}`
    );
    assert.ok(result.errors > 0, 'an unreadable skills directory must be an error');
    // Phase 4 must still run.
    assert.ok(
      lines.some((l) => /internal links|memory\.md/.test(l)),
      `later phases should still execute: ${lines.join(' | ')}`
    );
  });
});

describe('break: unreadable rules and root listings', () => {
  test('an unreadable rules directory is reported, not thrown', () => {
    const { result, lines } = runWithFaults(root, `{
      readdirSync: (p, ...rest) => {
        if (String(p).includes('rules')) throw new Error('EACCES: simulated');
        return orig.readdirSync(p, ...rest);
      }
    }`);
    assert.ok(
      lines.some((l) => /Could not list rule directory .*EACCES/.test(l)),
      `expected a rules-listing failure report: ${lines.join(' | ')}`
    );
    assert.ok(result.errors > 0, 'an unreadable rules directory must be an error');
  });

  test('an unreadable root still produces a non-zero error count', () => {
    // Remove AGENTS.md so the root is already invalid, then make the listing
    // unreadable: the run must not silently pass.
    fs.rmSync(path.join(root, 'AGENTS.md'));
    const { result } = runWithFaults(root, `{
      readdirSync: () => { throw new Error('EPERM: simulated unreadable root'); }
    }`);
    assert.ok(result.errors > 0, 'an unreadable root must not validate clean');
  });
});

describe('break: dangling symlinks in the tree', () => {
  test('a real dangling symlink in the tree is reported, not silently skipped', () => {
    // Symlinked subtrees were skipped entirely before, so a linked docs tree
    // got zero link coverage. A genuinely broken link must now be surfaced.
    // Windows blocks file-symlink creation without Developer Mode, so this is
    // skipped where the primitive is unavailable rather than faked.
    const linkPath = path.join(root, 'linked-docs');
    let created = false;
    try {
      fs.symlinkSync(path.join(root, 'does-not-exist'), linkPath, 'junction');
      created = true;
    } catch {
      return; // no symlink support on this host
    }
    try {
      const { lines } = collectDirect(root);
      assert.ok(
        lines.some((l) => /dangling symlink/i.test(l)),
        `expected a dangling-symlink report: ${lines.join(' | ')}`
      );
    } finally {
      if (created) fs.rmSync(linkPath, { force: true });
    }
  });
});
