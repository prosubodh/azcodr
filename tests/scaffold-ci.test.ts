/**
 * Starter-CI regression tests (ADR-021).
 * Locks the scaffolder's deterministic governance wiring: a Node-only starter
 * CI replaces azcodr's own dev workflows, the vendored boundary guard ships,
 * and the starter package.json exposes `boundaries` / `validate` scripts.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { copyTemplate, getTemplateDir } from '../src/scaffold.js';

const templateDir = getTemplateDir();

let tmpDir: string;
beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-scaffold-ci-'));
});

afterEach(() => {
  if (tmpDir && fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

describe('Starter CI replaces azcodr dev workflows in generated projects', () => {
  test('copyTemplate writes a Node-only starter CI and drops dev workflows', () => {
    copyTemplate(tmpDir, templateDir);

    const ciPath = path.join(tmpDir, '.github', 'workflows', 'ci.yml');
    assert.strictEqual(fs.existsSync(ciPath), true);
    const ci = fs.readFileSync(ciPath, 'utf-8');

    // Runs the vendored boundary guard and the governance validator...
    assert.match(ci, /boundary_guard\.js/);
    assert.match(ci, /validate-cli\.js/);
    // ...and nothing that only azcodr's own repo has.
    assert.doesNotMatch(ci, /benchmark\/run-benchmark\.js/);
    assert.doesNotMatch(ci, /test:mutation/);
    assert.doesNotMatch(ci, /npm ci/);
    assert.doesNotMatch(ci, /npm run build/);

    // azcodr's publish workflow must never leak into a generated project.
    assert.strictEqual(fs.existsSync(path.join(tmpDir, '.github', 'workflows', 'publish.yml')), false);
  });

  test('the vendored boundary guard ships inside the scaffold, not the dev lib/', () => {
    copyTemplate(tmpDir, templateDir);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, '.agents', 'scripts', 'boundary_guard.js')), true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, '.agents', 'lib', 'boundaries.js')), true);
    // lib/ is the repo's build output directory; it is not a template item.
    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'lib')), false);
  });

  test('dry run records the starter-CI action without writing anything', () => {
    const dest = path.join(tmpDir, 'nonexistent-dest');
    const actions = copyTemplate(dest, templateDir, { dryRun: true });
    assert.strictEqual(fs.existsSync(dest), false);
    assert.strictEqual(
      actions.some((a) => a.includes('generate: .github/workflows/ci.yml')),
      true
    );
  });

  test('starter package.json wires boundaries and validate scripts', () => {
    copyTemplate(tmpDir, templateDir);
    const pkg = JSON.parse(fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf-8'));
    assert.strictEqual(pkg.scripts.boundaries, 'node .agents/scripts/boundary_guard.js');
    assert.strictEqual(pkg.scripts.validate, 'node scripts/validate-cli.js');
  });

  test('starter CI is written even when the target already has a package.json', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'existing-app' }, null, 2));
    copyTemplate(tmpDir, templateDir);

    const ci = fs.readFileSync(path.join(tmpDir, '.github', 'workflows', 'ci.yml'), 'utf-8');
    assert.match(ci, /boundary_guard\.js/);
    const pkg = JSON.parse(fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf-8'));
    assert.strictEqual(pkg.name, 'existing-app');
  });

  test('bootstrap smoke test executes the vendored boundary guard', () => {
    const script = fs.readFileSync(
      path.join(templateDir, '.agents', 'skills', 'lets-build', 'scripts', 'bootstrap_workspace.sh'),
      'utf-8'
    );
    assert.match(script, /Running boundary smoke verification/);
    assert.match(script, /boundary_guard\.js/);
    assert.match(script, /node "\$\{ROOT\}\/\.agents\/scripts\/boundary_guard\.js"/);
  });
});