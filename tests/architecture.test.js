/**
 * Architecture tests: invariants enforced as code, not as README prose.
 * Each test fails the build when a documented guarantee regresses.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { TEMPLATE_ITEMS, ERROR_CODES } from '../lib/scaffold.js';
import * as runtime from '../lib/index.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const LIB_DIR = path.join(ROOT, 'lib');
const BIN_DIR = path.join(ROOT, 'bin');

function readAll(dir, filter = () => true) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...readAll(full, filter));
    else if (filter(full)) out.push({ path: full, source: fs.readFileSync(full, 'utf-8') });
  }
  return out;
}

const codeFiles = [...readAll(LIB_DIR, (f) => f.endsWith('.js')), ...readAll(BIN_DIR, (f) => f.endsWith('.js'))];

describe('Architecture: no shell-string spawning', () => {
  test('no shell-string process spawning anywhere in lib/ or bin/', () => {
    // Regression guard for 0dbdde0: every cp.execSync('git ...') call was a
    // shell-injection surface. The fix must not silently regress.
    const offenders = [];
    for (const { path: file, source } of codeFiles) {
      if (/\.execSync\s*\(/.test(source)) offenders.push(`${path.relative(ROOT, file)} (execSync)`);
      if (/\bexec\s*\(/.test(source)) offenders.push(`${path.relative(ROOT, file)} (exec)`);
      if (/child_process\.exec\b/.test(source)) offenders.push(`${path.relative(ROOT, file)} (child_process.exec)`);
    }
    assert.deepStrictEqual(offenders, [], `shell-string spawning found: ${offenders.join(', ')}`);
  });

  test('every execFileSync call passes shell:false', () => {
    for (const { path: file, source } of codeFiles) {
      if (!/execFileSync\s*\(/.test(source)) continue;
      assert.ok(
        /shell:\s*false/.test(source),
        `${path.relative(ROOT, file)} calls execFileSync without an explicit shell:false`
      );
    }
  });
});

describe('Architecture: git allowlist and scope guard', () => {

  test('git invocation is confined to an explicit subcommand allowlist', () => {
    // Scans every lib file: the allowlist must exist exactly once, wherever
    // the git boundary lives after refactoring, and must never admit a
    // history-mutating or remote-touching subcommand.
    const hits = codeFiles
      .map(({ path: file, source }) => ({ file: path.relative(ROOT, file), source }))
      .filter(({ source }) => /GIT_ALLOWED_SUBCOMMANDS\s*=\s*new Set\(\[/.test(source));
    assert.strictEqual(hits.length, 1, `expected one allowlist, found in: ${hits.map((h) => h.file).join(', ')}`);
    const allowed = hits[0].source.match(/GIT_ALLOWED_SUBCOMMANDS\s*=\s*new Set\(\[([^\]]+)\]/);
    assert.ok(allowed, 'expected a GIT_ALLOWED_SUBCOMMANDS Set literal');
    const members = [...allowed[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    // No history-mutating or remote-touching subcommand may be reachable.
    for (const forbidden of ['push', 'clone', 'remote', 'reset', 'clean', 'checkout']) {
      assert.ok(!members.includes(forbidden), `allowlist must not contain '${forbidden}'`);
    }
  });

  test('filesystem writes stay inside a scope guard', () => {
    // The guard may live in any lib module after refactoring, but the two
    // enforcement points must exist: the template read and the target write.
    const combined = codeFiles.map(({ source }) => source).join('\n');
    assert.ok(/function assertInside/.test(combined), 'expected an assertInside scope guard');
    assert.ok(/assertInside\(resolvedTemplate, srcPath\)/.test(combined), 'template read must be scoped');
    assert.ok(/assertInside\(resolvedTarget, destPath\)/.test(combined), 'target write must be scoped');
  });
});

describe('Architecture: no runtime dependencies', () => {
  test('no runtime dependencies are declared', () => {
    // The consumer supply-chain guarantee: nothing a user installs executes
    // third-party code. Dev tooling is governed by the test below, not this one.
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
    assert.strictEqual(pkg.dependencies, undefined);
  });
});

describe('Architecture: dev tooling pins', () => {

  test('dev tooling is exact-pinned and lockfile-committed', () => {
    // ADR-012: contributor tooling (ESLint, mandated by clean_code.md) is
    // allowed as devDependencies IFF every entry is an exact version (no ^, ~,
    // >=, or tags -- a floating range reintroduces the supply-chain risk the
    // zero-dep rule exists to prevent) and package-lock.json is committed, so
    // every contributor installs byte-identical tooling. devDependencies never
    // ship: the published tarball is bounded by the files[] allowlist and npm
    // never installs a dependency's devDependencies.
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
    const devDeps = pkg.devDependencies || {};
    for (const [name, range] of Object.entries(devDeps)) {
      assert.match(
        String(range),
        /^\d+\.\d+\.\d+(-[\w.]+)?$/,
        `devDependency '${name}@${range}' must be an exact version, not a range`
      );
    }
    assert.ok(
      fs.existsSync(path.join(ROOT, 'package-lock.json')),
      'package-lock.json must be committed while devDependencies exist'
    );
  });
});

describe('Architecture: require hygiene', () => {
  test('runtime code requires only node: builtins', () => {
    for (const { path: file, source } of codeFiles) {
      const imports = [
        ...source.matchAll(/(?:import\s+(?:[^'"]*from\s+)?|export\s+[^'"]*from\s+)['"]([^'"]+)['"]/g),
        ...source.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)
      ].map((m) => m[1]);
      for (const spec of imports) {
        assert.ok(
          spec.startsWith('node:') || spec.startsWith('./') || spec.startsWith('../'),
          `${path.relative(ROOT, file)} imports third-party module '${spec}'`
        );
      }
    }
  });
});

describe('Architecture: manifest and template stay in sync', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));

  test('every scaffolded template item exists in this repo', () => {
    const missing = TEMPLATE_ITEMS.filter((item) => !fs.existsSync(path.join(ROOT, item)));
    assert.deepStrictEqual(missing, [], `TEMPLATE_ITEMS reference missing paths: ${missing.join(', ')}`);
  });

  test('every package.json "files" entry exists (npm would silently drop it)', () => {
    const missing = pkg.files.filter((item) => !fs.existsSync(path.join(ROOT, item)));
    assert.deepStrictEqual(missing, [], `package.json files[] references missing paths: ${missing.join(', ')}`);
  });

  test('the shipped .d.ts declares every error code the runtime can throw', () => {
  // The runtime is the source of truth; a code present in ERROR_CODES but
  // absent from the public type declarations makes `err.code` untypeable.
  const dts = fs.readFileSync(path.join(ROOT, 'lib', 'index.d.ts'), 'utf-8');
  for (const code of Object.keys(ERROR_CODES)) {
    assert.ok(dts.includes(`'${code}'`), `lib/index.d.ts must declare error code ${code}`);
  }
});

test('the shipped .d.ts declares the exports the runtime actually provides', () => {
  const dts = fs.readFileSync(path.join(ROOT, 'lib', 'index.d.ts'), 'utf-8');
  for (const name of Object.keys(runtime)) {
    assert.ok(dts.includes(name), `lib/index.d.ts is missing runtime export '${name}'`);
  }
});
});

describe('Architecture: license and provenance', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));

  test('LICENSE is shipped so downstream projects inherit a license', () => {
    assert.ok(pkg.files.includes('LICENSE'));
    assert.ok(fs.existsSync(path.join(ROOT, 'LICENSE')));
  });

  test('provenance fields required by npm --provenance are declared', () => {
    // Without these, `npm publish --provenance` fails attestation silently
    // (learned the hard way in typed-settings commit 40f5bac).
    assert.ok(pkg.repository, 'repository field required for provenance');
    assert.ok(pkg.bugs, 'bugs field required for provenance');
    assert.ok(pkg.homepage, 'homepage field required for provenance');
  });
});

describe('Architecture: validator governance guarantees', () => {
  test('AGENTS.md stays within the line budget its own validator enforces', () => {
    const lines = fs.readFileSync(path.join(ROOT, 'AGENTS.md'), 'utf-8').split('\n').length;
    assert.ok(lines <= 150, `AGENTS.md is ${lines} lines; validator hard-fails above 150`);
  });

  test('AGENTS.md references only rule files that exist', () => {
    const content = fs.readFileSync(path.join(ROOT, 'AGENTS.md'), 'utf-8');
    const links = [...content.matchAll(/\]\(\.\/docs\/rules\/([^)]+)\)/g)].map((m) => m[1]);
    const broken = links.filter((f) => !fs.existsSync(path.join(ROOT, 'docs', 'rules', f)));
    assert.deepStrictEqual(broken, []);
  });

  test('README rule count matches the actual rules directory', () => {
    const actual = fs.readdirSync(path.join(ROOT, 'docs', 'rules')).filter((f) => f.endsWith('.md')).length;
    const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf-8');
    // Every stated rule count must agree with reality; a drifting catalog is
    // exactly the silent documentation rot this suite exists to prevent.
    const claims = [...readme.matchAll(/\b(\d+)\b[^.\n]{0,45}?\bdomain rules\b/gi)].map((m) => Number(m[1]));
    assert.ok(claims.length > 0, 'README should state a rule count');
    for (const claimed of claims) {
      assert.strictEqual(claimed, actual, `README claims ${claimed} rules, ${actual} exist`);
    }
  });
});

describe('Architecture: rules and ledger hygiene', () => {

  test('every rule file carries an H1 and the standardized Core Mandate', () => {
    const dir = path.join(ROOT, 'docs', 'rules');
    const bad = [];
    for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.md'))) {
      const content = fs.readFileSync(path.join(dir, f), 'utf-8');
      if (!/^# /m.test(content)) bad.push(`${f}: no H1`);
      if (!/^> \*\*Core Mandate:\*\*/m.test(content)) bad.push(`${f}: no Core Mandate`);
    }
    assert.deepStrictEqual(bad, []);
  });

  test('every rule file stays under the 24KB token-economy cap', () => {
    const dir = path.join(ROOT, 'docs', 'rules');
    const oversized = fs.readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .filter((f) => fs.statSync(path.join(dir, f)).size > 24000);
    assert.deepStrictEqual(oversized, []);
  });

  test('memory.md starts at ADR-001 with no template-leaked numbering', () => {
    const mem = fs.readFileSync(path.join(ROOT, 'memory.md'), 'utf-8');
    const withoutComments = mem.replace(/<!--[\s\S]*?-->/g, '');
    const ids = [...withoutComments.matchAll(/^#### ADR-(\d+)/gm)].map((m) => Number(m[1]));
    for (const id of ids) {
      assert.ok(id >= 1 && id <= 24, `ADR-${id} looks like leaked template numbering`);
    }
  });
});