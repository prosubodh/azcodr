/**
 * Mutation-gate regression tests.
 * Locks the mutation-gate story documented in ADR-021 and the consolidated
 * audit: the gate is the zero-dependency native harness
 * (`benchmark/mutation-test.js`), no orphaned `stryker.config.json` may
 * reappear, and the harness actually exercises the v2.6.0 guards.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function loadPkg() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
}

describe('mutation gate is the native harness, not an orphaned config', () => {
  test('no orphaned stryker config ships', () => {
    assert.strictEqual(
      fs.existsSync(path.join(ROOT, 'stryker.config.json')),
      false,
      'stryker.config.json was deleted in the 2.6.0 follow-up; do not re-add an orphaned config'
    );
  });

  test('package.json declares no stryker tooling', () => {
    const pkg = loadPkg();
    for (const [name, range] of Object.entries(pkg.devDependencies ?? {})) {
      assert.ok(
        !/stryker/i.test(name),
        `stryker must not be a devDependency (found ${name}@${range})`
      );
    }
  });

  test('test:mutation runs the native harness', () => {
    const pkg = loadPkg();
    assert.match(pkg.scripts['test:mutation'], /benchmark\/mutation-test\.js/);
  });

  test('CI runs the mutation gate on push/PR', () => {
    const ci = fs.readFileSync(path.join(ROOT, '.github', 'workflows', 'ci.yml'), 'utf-8');
    assert.match(ci, /test:mutation/);
  });

  test('the native harness locks the v2.6.0 guards', () => {
    const source = fs.readFileSync(path.join(ROOT, 'benchmark', 'mutation-test.js'), 'utf-8');
    assert.ok(/Starter CI Write Omission/.test(source), 'harness must mutate the starter-CI write');
    assert.ok(/Boundary Guard Fail-Closed Bypass/.test(source), 'harness must mutate the boundary runner');
    assert.ok(/testFile: 'tests\/scaffold-ci\.test\.ts'/.test(source));
    assert.ok(/testFile: 'tests\/boundary-guard\.test\.ts'/.test(source));
  });
});