import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { copyTemplate, getTemplateDir } from '../src/scaffold.js';
import * as api from '../src/index.js';

let tmpDir: string;
const templateDir = getTemplateDir();

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-test-'));
});

afterEach(() => {
  if (tmpDir && fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

describe('copyTemplate copies essential template files', () => {
  test('copyTemplate copies essential template files including .editorconfig, LICENSE, and package.json', () => {
    copyTemplate(tmpDir);

    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'AGENTS.md')), true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'memory.md')), true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'README.md')), true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, '.gitignore')), true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, '.editorconfig')), true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'LICENSE')), true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'package.json')), true);

    const mem = fs.readFileSync(path.join(tmpDir, 'memory.md'), 'utf-8');
    assert.match(mem, /No decisions recorded yet/);
    assert.doesNotMatch(mem, /ADR-015/);
  });

  test('copyTemplate does not ship opinionated content (docs, .agents, .github) by default', () => {
    copyTemplate(tmpDir);

    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'docs')), false);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, '.agents')), false);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, '.github')), false);
  });

  test('copyTemplate skips template items that do not exist in template directory', () => {
    const customTemplateDir = path.join(tmpDir, 'custom-tpl');
    fs.mkdirSync(customTemplateDir, { recursive: true });
    // Only create AGENTS.md, others are missing
    fs.writeFileSync(path.join(customTemplateDir, 'AGENTS.md'), '# Custom');

    const destDir = path.join(tmpDir, 'dest-dir');
    const actions = copyTemplate(destDir, customTemplateDir);

    assert.strictEqual(fs.existsSync(path.join(destDir, 'AGENTS.md')), true);
    assert.strictEqual(fs.existsSync(path.join(destDir, 'memory.md')), false);
    assert.strictEqual(actions.some(a => a.includes('AGENTS.md')), true);
  });
});

describe('copyTemplate dry run and ignore-file fallback', () => {
  test('copyTemplate supports dryRun mode without modifying destination', () => {
    const dryRunDest = path.join(tmpDir, 'non-existent-dest');
    const actions = copyTemplate(dryRunDest, templateDir, { dryRun: true });

    assert.strictEqual(fs.existsSync(dryRunDest), false);
    assert.strictEqual(actions.length > 0, true);
    assert.strictEqual(actions.some(a => a.includes('copy: AGENTS.md')), true);
    assert.strictEqual(actions.some(a => a.includes('copy: .editorconfig')), true);
    assert.strictEqual(actions.some(a => a.includes('copy: LICENSE')), true);
    assert.strictEqual(actions.some(a => a.includes('create: package.json')), true);
  });

  test('copyTemplate falls back to .npmignore when .gitignore is missing', () => {
    const fakeTpl = path.join(tmpDir, 'npmignore-tpl');
    fs.mkdirSync(fakeTpl, { recursive: true });
    fs.writeFileSync(path.join(fakeTpl, '.npmignore'), '# npmignore rules\nnode_modules/\n');

    const dest = path.join(tmpDir, 'npmignore-dest');
    copyTemplate(dest, fakeTpl);

    assert.strictEqual(fs.existsSync(path.join(dest, '.gitignore')), true);
    assert.match(fs.readFileSync(path.join(dest, '.gitignore'), 'utf-8'), /npmignore rules/);
  });
});

describe('copyTemplate does not ship shell scripts', () => {
  test('copyTemplate does not create .agents/skills directory', () => {
    copyTemplate(tmpDir, templateDir);

    assert.strictEqual(fs.existsSync(path.join(tmpDir, '.agents')), false);
  });
});

describe('copyTemplate handles ignore and package edge cases', () => {
  test('copyTemplate handles missing .gitignore and missing .npmignore gracefully', () => {
    const fakeTpl = path.join(tmpDir, 'empty-tpl');
    fs.mkdirSync(fakeTpl, { recursive: true });

    const dest = path.join(tmpDir, 'empty-dest');
    copyTemplate(dest, fakeTpl);

    assert.strictEqual(fs.existsSync(path.join(dest, '.gitignore')), false);
  });

  test('copyTemplate preserves existing package.json and handles root directory fallback', () => {
    const customPkgPath = path.join(tmpDir, 'package.json');
    fs.writeFileSync(customPkgPath, JSON.stringify({ name: 'existing-app' }));

    const actions = copyTemplate(tmpDir, templateDir);
    assert.strictEqual(actions.some(a => a.includes('create: package.json')), false);
    const loaded = JSON.parse(fs.readFileSync(customPkgPath, 'utf-8'));
    assert.strictEqual(loaded.name, 'existing-app');

    // Test project name fallback when path.basename is empty string
    const origBasename = path.basename;
    try {
      path.basename = () => '';
      const dest = path.join(tmpDir, 'fallback-name-dest');
      copyTemplate(dest, templateDir);
      const pkg = JSON.parse(fs.readFileSync(path.join(dest, 'package.json'), 'utf-8'));
      assert.strictEqual(pkg.name, 'my-project');
    } finally {
      path.basename = origBasename;
    }
  });
});

describe('index.js public API surface', () => {
  test('index.js exports scaffold, constants, and helper methods', () => {
    assert.strictEqual(typeof api.scaffold, 'function');
    assert.strictEqual(typeof api.validateTarget, 'function');
    assert.strictEqual(typeof api.copyTemplate, 'function');
    assert.strictEqual(typeof api.ensureSymlink, 'function');
    assert.strictEqual(typeof api.ensureSymlinkOrPointer, 'function');
    assert.strictEqual(typeof api.isSameCaseInsensitiveFile, 'function');
    assert.strictEqual(typeof api.makeScriptsExecutable, 'function');
    assert.strictEqual(typeof api.isInsideGitWorkTree, 'function');
    assert.strictEqual(typeof api.initGit, 'function');
    assert.strictEqual(typeof api.getTemplateDir, 'function');
    assert.strictEqual(typeof api.runGit, 'function');
    assert.strictEqual(typeof api.assertInside, 'function');
    assert.strictEqual(Array.isArray(api.TEMPLATE_ITEMS), true);
    assert.strictEqual(api.TEMPLATE_ITEMS.includes('.editorconfig'), true);
    assert.strictEqual(api.TEMPLATE_ITEMS.includes('LICENSE'), true);
  });
});
