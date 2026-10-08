/**
 * In-process fault injection for the validator's defensive branches.
 *
 * tests/validate-faults.test.js proves the same behaviours through a
 * subprocess harness, but a subprocess runs plain `node` without the coverage
 * flag, so those executions contribute zero coverage. The fault handlers then
 * show up as uncovered and the gate fails. These tests inject the identical
 * faults in-process (via defineProperty on the shared `node:fs` module object,
 * always restored in `finally`) so the defensive branches are genuinely
 * executed under coverage.
 *
 * Every override is scoped to a path containing a marker string and delegates
 * everything else to the original implementation, so the rest of the
 * validation run behaves normally.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { runValidation } from '../scripts/validate.js';

const orig: Record<string, any> = {
  readdirSync: fs.readdirSync, realpathSync: fs.realpathSync, statSync: fs.statSync,
  readFileSync: fs.readFileSync, existsSync: fs.existsSync
};

function withFsOverrides<T>(overrides: Record<string, any>, fn: () => T): T {
  for (const [name, impl] of Object.entries(overrides)) {
    Object.defineProperty(fs, name, { value: impl, configurable: true, writable: true });
  }
  try {
    return fn();
  } finally {
    for (const name of Object.keys(overrides)) {
      Object.defineProperty(fs, name, { value: orig[name], configurable: true, writable: true });
    }
  }
}

function collect(root: string) {
  const lines: string[] = [];
  const result = runValidation(root, {
    pass: (m: string) => lines.push(`PASS ${m}`),
    warn: (m: string) => lines.push(`WARN ${m}`),
    fail: (m: string) => lines.push(`FAIL ${m}`),
    log: () => {},
    heading: () => {}
  });
  return { result, lines, joined: lines.join('\n') };
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-infault-'));
  fs.writeFileSync(path.join(root, 'AGENTS.md'), '# A\n');
  for (const n of ['CLAUDE.md', 'GEMINI.md', '.cursorrules', '.windsurfrules']) {
    fs.writeFileSync(path.join(root, n), 'AGENTS.md\n');
  }
  fs.writeFileSync(path.join(root, '.gitignore'), 'x\n');
  fs.mkdirSync(path.join(root, 'docs', 'rules'), { recursive: true });
  fs.mkdirSync(path.join(root, '.agents', 'skills', 'demo'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs', 'rules', 'r.md'), '# R\n\n> **Core Mandate:** x\n');
  fs.writeFileSync(path.join(root, '.agents', 'skills', 'demo', 'SKILL.md'), '---\nname: demo\ndescription: Use when x. Do not use y.\n---\n\n## Gotchas\n');
  fs.writeFileSync(path.join(root, 'memory.md'), '# Memory\n');
  return root;
}

function fakeSymlinkEntry(name: string) {
  return { name, isDirectory: () => false, isSymbolicLink: () => true, isFile: () => false };
}

function codedError(code: string) {
  return Object.assign(new Error(code), { code });
}

function readdirThrowing(marker: string, error: any) {
  return (p: any, ...rest: any[]) => {
    if (String(p).endsWith(marker)) throw error;
    return orig['readdirSync'](p, ...rest);
  };
}

function readThrowing(marker: string, error: any) {
  return (p: any, ...rest: any[]) => {
    if (String(p).includes(marker)) throw error;
    return orig['readFileSync'](p, ...rest);
  };
}

function linkedDir(root: string) {
  const dir = path.join(root, 'linked');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function ghostOverrides(linkDir: string, name: string, resolution: any) {
  return {
    readdirSync: (p: any, ...rest: any[]) => {
      if (resolution.listThrows && String(p).includes(name)) throw resolution.listThrows;
      const entries = orig['readdirSync'](p, ...rest);
      if (String(p) === linkDir) return [...entries, fakeSymlinkEntry(name), ...(resolution.withDup ? [fakeSymlinkEntry(`${name}-dup`)] : [])];
      return entries;
    },
    realpathSync: (p: any, ...rest: any[]) => {
      if (!String(p).includes(name)) return orig['realpathSync'](p, ...rest);
      if (resolution.realThrows) throw resolution.realThrows;
      return resolution.real;
    },
    statSync: (p: any, ...rest: any[]) => {
      if (!String(p).includes(name)) return orig['statSync'](p, ...rest);
      if (resolution.statThrows) throw resolution.statThrows;
      return resolution.stat;
    }
  };
}

function fakeReal(name: string) {
  return `${path.sep}fake${path.sep}${name}`;
}

describe('in-process faults: traversal aborts', () => {
  let root: string;
  beforeEach(() => { root = fixture(); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('a stack-exhausting traversal fails loudly instead of reporting clean', () => {
    fs.mkdirSync(path.join(root, 'deep'));
    const throwing = readdirThrowing(`${path.sep}deep`, new RangeError('Maximum call stack size exceeded'));
    const { result, joined } = withFsOverrides({ readdirSync: throwing }, () => collect(root));
    assert.ok(joined.includes('Directory traversal exhausted the stack'), joined);
    assert.ok(result.errors > 0);
  });

  test('an unreadable link-tree directory is reported as skipped', () => {
    fs.mkdirSync(path.join(root, 'locked'));
    const throwing = readdirThrowing(`${path.sep}locked`, codedError('EACCES'));
    const { joined } = withFsOverrides({ readdirSync: throwing }, () => collect(root));
    assert.ok(joined.includes('Skipped unreadable directory'), joined);
  });

  test('a stack-exhausting traversal at root reports dot', () => {
    const throwing = (p: any, ...rest: any[]) => {
      if (String(p) === root) throw new RangeError('Maximum call stack size exceeded');
      return orig['readdirSync'](p, ...rest);
    };
    const { joined } = withFsOverrides({ readdirSync: throwing }, () => collect(root));
    assert.ok(joined.includes('Directory traversal exhausted the stack at .'), joined);
  });
});

describe('in-process faults: dangling and resolvable links', () => {
  let root: string;
  beforeEach(() => { root = fixture(); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('a dangling symlink is reported and skipped', () => {
    const dir = linkedDir(root);
    const overrides = ghostOverrides(dir, 'ghost.md', { realThrows: codedError('ENOENT') });
    const { joined } = withFsOverrides(overrides, () => collect(root));
    assert.ok(joined.includes('Skipped dangling symlink'), joined);
  });

  test('a resolvable symlink to a file is followed and checked', () => {
    const dir = linkedDir(root);
    const stat = { isDirectory: () => false, isFile: () => false };
    const overrides = ghostOverrides(dir, 'ghost.md', { real: fakeReal('real.md'), stat, withDup: true });
    const { joined, result } = withFsOverrides(overrides, () => collect(root));
    assert.ok(joined.includes('ghost.md'), joined);
    assert.ok(result.errors > 0);
  });

  test('symlink to non-markdown file is skipped without checking', () => {
    const dir = linkedDir(root);
    const stat = { isDirectory: () => false, isFile: () => true };
    const overrides = ghostOverrides(dir, 'ghost.txt', { real: fakeReal('real.txt'), stat });
    const { joined } = withFsOverrides(overrides, () => collect(root));
    assert.ok(!joined.includes('FAIL'), joined);
  });
});

describe('in-process faults: stat and descent failures', () => {
  let root: string;
  beforeEach(() => { root = fixture(); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('a stat failure during link resolution degrades instead of crashing', () => {
    const dir = linkedDir(root);
    const overrides = ghostOverrides(dir, 'ghost.md', {
      real: fakeReal('real.md'),
      statThrows: codedError('EACCES')
    });
    const { joined, result } = withFsOverrides(overrides, () => collect(root));
    assert.ok(joined.includes('ghost.md'), joined);
    assert.ok(result.errors > 0);
  });

  test('a resolvable symlink to a directory is descended into', () => {
    const dir = linkedDir(root);
    const stat = { isDirectory: () => true, isFile: () => false };
    const overrides = ghostOverrides(dir, 'ghost-dir', {
      real: fakeReal('realdir'),
      stat,
      listThrows: codedError('ENOENT')
    });
    const { joined } = withFsOverrides(overrides, () => collect(root));
    assert.ok(joined.includes('ghost-dir'), joined);
  });
});

describe('in-process faults: root and parity slots', () => {
  let root: string;
  beforeEach(() => { root = fixture(); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('an unresolvable workspace root is reported, not thrown', () => {
    const throwing = (p: any, ...rest: any[]) => {
      if (String(p) === root) throw codedError('EACCES');
      return orig['realpathSync'](p, ...rest);
    };
    const { joined, result } = withFsOverrides({ realpathSync: throwing }, () => collect(root));
    assert.ok(typeof result.errors === 'number');
    assert.ok(joined.length > 0);
  });

  test('a directory occupying a parity slot is rejected without crashing', () => {
    fs.rmSync(path.join(root, 'CLAUDE.md'));
    fs.mkdirSync(path.join(root, 'CLAUDE.md'));
    const { joined, result } = collect(root);
    assert.ok(joined.includes('neither a symlink nor a regular file'), joined);
    assert.ok(result.errors > 0);
  });
});

describe('in-process faults: unreadable listings', () => {
  let root: string;
  beforeEach(() => { root = fixture(); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('an unreadable rules directory is reported, not thrown', () => {
    const throwing = readdirThrowing('rules', codedError('EACCES'));
    const { joined, result } = withFsOverrides({ readdirSync: throwing }, () => collect(root));
    assert.ok(joined.includes('Could not list rule directory'), joined);
    assert.ok(result.errors > 0);
  });

  test('an unreadable skills directory is reported, not thrown', () => {
    const throwing = readdirThrowing('skills', codedError('EACCES'));
    const { joined, result } = withFsOverrides({ readdirSync: throwing }, () => collect(root));
    assert.ok(joined.includes('Could not list skills directory'), joined);
    assert.ok(result.errors > 0);
  });

  test('non-directory entries in the skills listing are skipped', () => {
    fs.writeFileSync(path.join(root, '.agents', 'skills', 'NOTES.md'), '# notes\n');
    const { result, joined } = collect(root);
    assert.strictEqual(result.errors, 0, joined);
    assert.ok(joined.includes('Validated 1 skills'), joined);
  });
});

describe('in-process faults: unreadable files', () => {
  let root: string;
  beforeEach(() => { root = fixture(); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('an unreadable memory.md is reported without aborting the run', () => {
    const throwing = readThrowing('memory.md', codedError('EACCES'));
    const { result, joined } = withFsOverrides({ readFileSync: throwing }, () => collect(root));
    assert.ok(joined.includes('Could not read memory.md'), joined);
    assert.ok(result.errors > 0);
  });

  test('an unreadable AGENTS.md is reported and later phases still run', () => {
    const throwing = readThrowing('AGENTS.md', codedError('EACCES'));
    const { result, joined } = withFsOverrides({ readFileSync: throwing }, () => collect(root));
    assert.ok(joined.includes('Could not read AGENTS.md'), joined);
    assert.ok(joined.includes('modular rule files'), joined);
    assert.ok(result.errors > 0);
  });

  test('an unreadable rule file is reported, not thrown', () => {
    const throwing = readThrowing('r.md', codedError('EACCES'));
    const { result, joined } = withFsOverrides({ readFileSync: throwing }, () => collect(root));
    assert.ok(joined.includes('Could not read Rule r.md'), joined);
    assert.ok(result.errors > 0);
  });

  test('an unreadable glossary file is reported when ADRs exist', () => {
    fs.mkdirSync(path.join(root, 'docs', 'knowledge'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs', 'knowledge', 'ubiquitous_language.md'), '# UL\n');
    fs.writeFileSync(path.join(root, 'memory.md'), '# Memory\n\n| ID | Title |\n|---|---|\n| ADR-001 | Test |\n\n#### ADR-001: Test\n- **Date:** 2026-10-07\n');
    const throwing = readThrowing('ubiquitous_language.md', codedError('EACCES'));
    const { joined, result } = withFsOverrides({ readFileSync: throwing }, () => collect(root));
    assert.ok(joined.includes('Could not read ubiquitous_language.md'), joined);
    assert.ok(result.errors > 0);
  });
});
