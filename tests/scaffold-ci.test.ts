/**
 * Starter-CI regression tests (ADR-021).
 *
 * The scaffold no longer ships CI workflows or the vendored boundary guard.
 * These tests verify that no CI or guard artifacts are scaffolded by default.
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

describe('Scaffolded project does not ship CI or guards', () => {
  test('copyTemplate does not scaffold .github directory', () => {
    copyTemplate(tmpDir, templateDir);

    assert.strictEqual(fs.existsSync(path.join(tmpDir, '.github')), false);
  });

  test('copyTemplate does not scaffold .agents directory', () => {
    copyTemplate(tmpDir, templateDir);

    assert.strictEqual(fs.existsSync(path.join(tmpDir, '.agents')), false);
  });

  test('copyTemplate does not ship vendor boundary guard scripts', () => {
    copyTemplate(tmpDir, templateDir);

    assert.strictEqual(fs.existsSync(path.join(tmpDir, '.agents', 'scripts', 'boundary_guard.js')), false);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, '.agents', 'lib', 'boundaries.js')), false);
  });

  test('starter package.json wires only check and validate scripts', () => {
    copyTemplate(tmpDir, templateDir);
    const pkg = JSON.parse(fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf-8'));
    assert.strictEqual(pkg.scripts.check, 'npx azcodr check');
    assert.strictEqual(pkg.scripts.validate, 'npx azcodr check');
    assert.strictEqual(pkg.scripts.boundaries, undefined);
    assert.strictEqual(pkg.scripts.smoke, undefined);
  });

  test('starter CI is not written when target already has a package.json', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'existing-app' }, null, 2));
    copyTemplate(tmpDir, templateDir);

    assert.strictEqual(fs.existsSync(path.join(tmpDir, '.github', 'workflows')), false);
    const pkg = JSON.parse(fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf-8'));
    assert.strictEqual(pkg.name, 'existing-app');
  });
});
