import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveChecks, explainCheck, matchGlob, matchesAny } from '../src/harness-resolve.js';
import { parseHarnessConfig } from '../src/harness-config.js';
import type { HarnessConfig } from '../src/harness-config.js';

function cfg(yaml: string): HarnessConfig {
  return parseHarnessConfig(yaml);
}

const project = { languages: ['typescript'], commands: {} };
const EMPTY = 'version: 1\n';
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('glob matching', () => {
  test('matches a bare directory prefix', () => {
    assert.strictEqual(matchGlob('src/auth/service.ts', 'src/**'), true);
    assert.strictEqual(matchGlob('lib/a.js', 'src/**'), false);
  });

  test('matches a single-segment wildcard', () => {
    assert.strictEqual(matchGlob('src/a/b.ts', 'src/*'), false);
    assert.strictEqual(matchGlob('src/a.ts', 'src/*'), true);
  });

  test('matches anywhere when the pattern is a bare filename glob', () => {
    assert.strictEqual(matchGlob('vendor/lib/thing.js', '**/*.d.ts'), false);
    assert.strictEqual(matchGlob('types/index.d.ts', '**/*.d.ts'), true);
  });

  test('normalises Windows separators', () => {
    assert.strictEqual(matchGlob('src\\auth\\service.ts', 'src/**'), true);
  });

  test('matchesAny is the existential form over a pattern list', () => {
    assert.strictEqual(matchesAny('src/a.ts', ['lib/**', 'src/**']), true);
    assert.strictEqual(matchesAny('src/a.ts', ['lib/**']), false);
    assert.strictEqual(matchesAny('src/a.ts', []), false);
  });
});

describe('check resolution', () => {
  test('an undeclared check is disabled with an explicit reason', () => {
    const v = resolveChecks(cfg(EMPTY), project).get('max-file-lines');
    assert.strictEqual(v?.enabled, false);
    assert.match(v?.reason ?? '', /not declared/);
  });

  test('a declared check with no applies_when is enabled', () => {
    const v = resolveChecks(cfg('version: 1\nchecks:\n  - id: max-file-lines\n'), project)
      .get('max-file-lines');
    assert.strictEqual(v?.enabled, true);
    assert.strictEqual(v?.severity, 'error');
    assert.strictEqual(v?.matchedBy, 'declared');
  });

  test('paths gate a check to matching files only', () => {
    const c = cfg('version: 1\nchecks:\n  - id: max-file-lines\n    paths: ["src/**"]\n');
    const v = resolveChecks(c, project).get('max-file-lines');
    assert.strictEqual(v?.enabledFor('src/a.ts'), true);
    assert.strictEqual(v?.enabledFor('lib/a.js'), false);
  });

  test('exclude wins over paths', () => {
    const c = cfg(
      'version: 1\nchecks:\n  - id: max-file-lines\n    paths: ["src/**"]\n    exclude: ["src/generated/**"]\n'
    );
    const v = resolveChecks(c, project).get('max-file-lines');
    assert.strictEqual(v?.enabledFor('src/a.ts'), true);
    assert.strictEqual(v?.enabledFor('src/generated/api.ts'), false);
  });

  test('languages gate a check to declared project languages', () => {
    const c = cfg('version: 1\nchecks:\n  - id: layer-boundaries\n    languages: [go]\n');
    const go = resolveChecks(c, { languages: ['go'], commands: {} }).get('layer-boundaries');
    assert.strictEqual(go?.enabled, true);
    const ts = resolveChecks(c, { languages: ['typescript'], commands: {} }).get('layer-boundaries');
    assert.strictEqual(ts?.enabled, false);
    assert.match(ts?.reason ?? '', /languages/);
  });

  test('severity off disables without deleting the declaration', () => {
    const c = cfg('version: 1\nchecks:\n  - id: max-file-lines\n    severity: off\n');
    const v = resolveChecks(c, project).get('max-file-lines');
    assert.strictEqual(v?.enabled, false);
    assert.match(v?.reason ?? '', /severity/);
  });

  test('severity warn is enabled but downgraded', () => {
    const v = resolveChecks(cfg('version: 1\nchecks:\n  - id: a\n    severity: warn\n'), project).get('a');
    assert.strictEqual(v?.enabled, true);
    assert.strictEqual(v?.severity, 'warn');
  });

  test('core safety checks resolve on with no config at all', () => {
    const report = resolveChecks(cfg(EMPTY), project);
    assert.strictEqual(report.get('destructive-commands')?.enabled, true);
    assert.strictEqual(report.get('destructive-commands')?.core, true);
    assert.strictEqual(report.get('protected-targets')?.enabled, true);
    assert.strictEqual(report.get('dependency-cycles')?.enabled, true);
  });

  test('a config cannot disable a core safety check', () => {
    const c = cfg(
      'version: 1\nchecks:\n  - id: destructive-commands\n    enabled: false\n    severity: off\n'
    );
    const v = resolveChecks(c, project).get('destructive-commands');
    assert.strictEqual(v?.enabled, true, 'core checks are not user-removable');
    assert.strictEqual(v?.overridden, true, 'the attempt is recorded, not hidden');
  });

  test('layer-boundaries is not core, so it stays off unless declared', () => {
    assert.strictEqual(resolveChecks(cfg(EMPTY), project).get('layer-boundaries')?.enabled, false);
  });

  test('a check with no layer rules cannot report violations', () => {
    const c = cfg('version: 1\nchecks:\n  - id: layer-boundaries\n');
    const v = resolveChecks(c, project).get('layer-boundaries');
    assert.deepStrictEqual(v?.layers, {});
  });

  test('declared layer rules are carried through to the resolver', () => {
    const c = cfg('version: 1\nchecks:\n  - id: layer-boundaries\n    layers: { domain: [adapters] }\n');
    const v = resolveChecks(c, project).get('layer-boundaries');
    assert.deepStrictEqual(v?.layers, { domain: ['adapters'] });
  });

  test('a has-gate disables a check when the required path is absent', () => {
    const c = cfg('version: 1\nchecks:\n  - id: layer-boundaries\n    has: ["migrations"]\n');
    const missing = resolveChecks(c, project).get('layer-boundaries');
    assert.strictEqual(missing?.enabled, false);
    assert.match(missing?.reason ?? '', /do not exist/);
  });

  test('a has-gate enables a check when the required path exists', () => {
    const c = cfg('version: 1\nchecks:\n  - id: layer-boundaries\n    has: ["src"]\n');
    const found = resolveChecks(c, { ...project, root: path.join(REPO_ROOT) }).get('layer-boundaries');
    assert.strictEqual(found?.enabled, true);
  });
});

describe('explain', () => {
  test('explains why a check is enabled', () => {
    const text = explainCheck(
      resolveChecks(cfg('version: 1\nchecks:\n  - id: max-file-lines\n    severity: warn\n'), project),
      'max-file-lines'
    );
    assert.match(text, /max-file-lines/);
    assert.match(text, /declared/);
    assert.match(text, /warn/);
  });

  test('explains why an undeclared check is off', () => {
    assert.match(explainCheck(resolveChecks(cfg(EMPTY), project), 'max-file-lines'), /not declared/);
  });

  test('distinguishes an id the harness has never heard of', () => {
    assert.match(explainCheck(resolveChecks(cfg(EMPTY), project), 'nope'), /unknown check id/);
  });

  test('explains a core check as non-removable', () => {
    assert.match(explainCheck(resolveChecks(cfg(EMPTY), project), 'destructive-commands'), /core/i);
  });
});
