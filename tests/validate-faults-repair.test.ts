/**
 * Filesystem-fault tests for validator parity repair.
 *
 * Split from tests/validate-faults.test.js: repair paths that must warn or
 * degrade cleanly instead of crashing or claiming false success.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { runValidation, createLowercaseParityLink } from '../scripts/validate.js';

/**
 * Runs the validator against a fixture with `node:fs` fault injection.
 * Real subprocess (not require) so the mock applies to the module's own
 * fs reference, exactly as it would in a broken environment.
 */
function runWithFaults(root: string, patch: string) {
  const orig: Record<string, any> = {};
  for (const name of Object.keys(fs)) {
    orig[name] = (fs as any)[name];
  }
  const overrides = new Function('fs', 'orig', `return ${patch}`)(fs, orig);
  for (const [name, impl] of Object.entries(overrides)) {
    Object.defineProperty(fs, name, { value: impl, configurable: true, writable: true });
  }
  const lines: string[] = [];
  const reporter = {
    pass: (m: string) => lines.push('PASS ' + m),
    warn: (m: string) => lines.push('WARN ' + m),
    fail: (m: string) => lines.push('FAIL ' + m),
    log: () => {},
    heading: () => {}
  };
  try {
    const result = runValidation(root, reporter);
    return { result, lines };
  } finally {
    for (const name of Object.keys(overrides)) {
      Object.defineProperty(fs, name, { value: orig[name], configurable: true, writable: true });
    }
  }
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

/** Fault patch for a read-only case-sensitive workspace repair. */
function unrecoverablePatch() {
  return `{
    readdirSync: (p, ...rest) => {
      const entries = orig.readdirSync(p, ...rest);
      return entries.filter((e) => e !== 'agents.md');
    },
    existsSync: (p) => {
      if (String(p).endsWith('agents.md') && !String(p).endsWith('AGENTS.md')) return false;
      return orig.existsSync(p);
    },
    symlinkSync: () => { throw new Error('EPERM: simulated no-symlink-host'); },
    writeFileSync: (p, ...rest) => {
      if (String(p).endsWith('agents.md') && !String(p).endsWith('AGENTS.md')) {
        throw new Error('EROFS: simulated read-only');
      }
      return orig.writeFileSync(p, ...rest);
    }
  }`;
}

let root: string;
beforeEach(() => { root = fixture(); });
afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

describe('break: parity repair on a case-sensitive filesystem', () => {
  test('the parity repair runs on a case-sensitive filesystem', () => {
    // Unreachable on Windows (existsSync('agents.md') resolves true), so model
    // the case-sensitive view: report 'agents.md' as absent and let the repair
    // create it. This is the path that must produce the pointer.
    const { lines } = runWithFaults(root, `{
      existsSync: (p) => {
        if (String(p).endsWith('agents.md') && !String(p).endsWith('AGENTS.md')) return false;
        return orig.existsSync(p);
      },
      symlinkSync: () => { throw new Error('EPERM: simulated no-symlink-host'); }
    }`);
    assert.ok(
      lines.some((l) => /Created agents\.md parity link/.test(l)),
      `expected the repair path to run: ${lines.join(' | ')}`
    );
  });
});

describe('break: unrecoverable parity repair warns', () => {
  test('an unrecoverable parity repair is reported, not silently swallowed', () => {
    // Simulate a genuinely case-sensitive workspace (no agents.md in the
    // listing, existsSync false) on a read-only filesystem: neither symlink nor
    // pointer can be written. The validator must warn, not crash.
    const { lines, result } = runWithFaults(root, unrecoverablePatch());
    assert.ok(
      lines.some((l) => /Could not restore agents\.md parity/.test(l)),
      `expected an unrecoverable-repair warning: ${lines.join(' | ')}`
    );
    assert.ok(
      !lines.some((l) => /Created agents\.md parity link/.test(l)),
      'must not claim a successful repair'
    );
    assert.ok(result.warnings > 0, 'the unrecoverable repair must be surfaced as a warning');
    assert.strictEqual(typeof result.errors, 'number');
  });
});

describe('break: repair degrades cleanly when both strategies fail', () => {
  test('the parity repair degrades cleanly when both strategies fail', () => {
    // Directly exercise the read-only branch: symlink creation fails AND the
    // text-pointer write fails. The validator must neither claim success nor
    // crash; checkParity reports agents.md as unsatisfied.
    fs.rmSync(path.join(root, 'agents.md'), { force: true });
    const { lines, result } = runWithFaults(root, `{
      existsSync: (p) => {
        if (String(p).endsWith('agents.md') && !String(p).endsWith('AGENTS.md')) return false;
        return orig.existsSync(p);
      },
      symlinkSync: () => { throw new Error('EPERM: simulated no-symlink-host'); },
      writeFileSync: (p, ...rest) => {
        if (String(p).endsWith('agents.md') && !String(p).endsWith('AGENTS.md')) {
          throw new Error('EROFS: simulated read-only');
        }
        return orig.writeFileSync(p, ...rest);
      }
    }`);
    assert.ok(
      !lines.some((l) => /Created agents\.md parity link/.test(l)),
      `must not claim the repair succeeded: ${lines.join(' | ')}`
    );
    assert.ok(
      lines.some((l) => /agents\.md/.test(l)),
      `expected an agents.md verdict: ${lines.join(' | ')}`
    );
    assert.ok(result.errors > 0, 'an unrepairable parity file must be an error');
  });
});

describe('break: read-only workspace still reports agents.md', () => {
  test('a read-only workspace that cannot create agents.md still reports it', () => {
    // Both repair strategies fail: symlinks unsupported AND the workspace is
    // read-only. The validator must not claim success and must not crash.
    // Delete agents.md first so the repair path is genuinely required.
    fs.rmSync(path.join(root, 'agents.md'), { force: true });
    const { lines, result } = runWithFaults(root, `{
      existsSync: (p) => {
        if (String(p).endsWith('agents.md') && !String(p).endsWith('AGENTS.md')) return false;
        return orig.existsSync(p);
      },
      symlinkSync: () => { throw new Error('EPERM: simulated no-symlink-host'); },
      writeFileSync: (p, ...rest) => {
        if (String(p).endsWith('agents.md') && !String(p).endsWith('AGENTS.md')) {
          throw new Error('EROFS: simulated read-only');
        }
        return orig.writeFileSync(p, ...rest);
      }
    }`);
    assert.ok(
      !lines.some((l) => /Created agents\.md parity link/.test(l)),
      `must not claim the repair succeeded: ${lines.join(' | ')}`
    );
    assert.ok(
      lines.some((l) => /agents\.md/.test(l)),
      `expected an agents.md verdict: ${lines.join(' | ')}`
    );
    assert.ok(result.errors > 0, 'an unrepairable parity file must be an error');
  });
});

describe('createLowercaseParityLink: symlink and pointer strategies', () => {
  let tmp: string;
  beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-parity-')); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  test('creates a symlink when symlinks are supported', () => {
    const target = path.join(tmp, 'agents.md');
    const calls: any[][] = [];
    const fsImpl = {
      symlinkSync: (a: any, b: any) => calls.push(['symlink', a, b]),
      writeFileSync: () => calls.push(['write'])
    };
    const r = createLowercaseParityLink(target, fsImpl as any);
    assert.strictEqual(r.created, true);
    assert.strictEqual(r.strategy, 'symlink');
    assert.strictEqual(r.reason, null);
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0]![0], 'symlink');
  });

  test('falls back to a text pointer when symlinks are unsupported', () => {
    const target = path.join(tmp, 'agents.md');
    const r = createLowercaseParityLink(target, {
      symlinkSync: () => { throw Object.assign(new Error('EPERM'), { code: 'EPERM' }); },
      writeFileSync: (p: any, data: any) => { fs.writeFileSync(p, data); }
    } as any);
    assert.strictEqual(r.created, true);
    assert.strictEqual(r.strategy, 'pointer');
    assert.strictEqual(fs.readFileSync(target, 'utf-8'), 'AGENTS.md\n');
  });
});

describe('createLowercaseParityLink: the unrecoverable case', () => {
  let tmp: string;
  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-parity-'));
  });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  test('reports unrecoverable when BOTH strategies fail, without throwing', () => {
    const target = path.join(tmp, 'agents.md');
    const r = createLowercaseParityLink(target, {
      symlinkSync: () => { throw Object.assign(new Error('EPERM'), { code: 'EPERM' }); },
      writeFileSync: () => { throw Object.assign(new Error('EROFS'), { code: 'EROFS' }); }
    } as any);
    assert.strictEqual(r.created, false);
    assert.strictEqual(r.strategy, null);
    assert.match(r.reason!, /EPERM/);
    assert.match(r.reason!, /EROFS/);
    assert.strictEqual(fs.existsSync(target), false, 'nothing should have been written');
  });
});
