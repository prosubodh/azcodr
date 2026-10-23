import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  getPackDefinition,
  installPack,
  KNOWN_PACK_NAMES
} from '../src/pack.js';
import { parseHarnessConfig } from '../src/harness-config.js';

describe('Capability pack definitions', () => {
  test('returns known pack definitions for standard names', () => {
    const tdd = getPackDefinition('tdd');
    assert.strictEqual(tdd.name, 'tdd');
    assert.strictEqual(tdd.methodology, 'tdd');
    assert.ok(tdd.checks?.some((c) => c.id === 'red-before-green'));

    const boundaries = getPackDefinition('boundaries');
    assert.strictEqual(boundaries.name, 'boundaries');
    assert.ok(boundaries.checks?.some((c) => c.id === 'layer-boundaries'));
  });

  test('normalizes aliases to canonical names', () => {
    assert.strictEqual(getPackDefinition('test-driven').name, 'tdd');
    assert.strictEqual(getPackDefinition('boundary-guard').name, 'boundaries');
    assert.strictEqual(getPackDefinition('pre-push-guard').name, 'pre-push');
    assert.strictEqual(getPackDefinition('hook').name, 'pre-push');
    assert.strictEqual(getPackDefinition('github-ci').name, 'ci');
    assert.strictEqual(getPackDefinition('actions').name, 'ci');
    assert.strictEqual(getPackDefinition('workflows').name, 'ci');
    assert.strictEqual(getPackDefinition('workflow').name, 'ci');
    assert.strictEqual(getPackDefinition('ci-workflow').name, 'ci');
    assert.strictEqual(getPackDefinition('publish').name, 'publish-workflow');
    assert.strictEqual(getPackDefinition('publish-action').name, 'publish-workflow');
    assert.strictEqual(getPackDefinition('release-workflow').name, 'publish-workflow');
  });

  test('returns ci and publish-workflow definitions', () => {
    const ci = getPackDefinition('ci');
    assert.strictEqual(ci.name, 'ci');
    assert.ok(ci.description.toLowerCase().includes('continuous integration'));

    const pub = getPackDefinition('publish-workflow');
    assert.strictEqual(pub.name, 'publish-workflow');
    assert.ok(pub.description.toLowerCase().includes('publishing') || pub.description.toLowerCase().includes('release'));
  });

  test('returns pre-push pack with protected-branches check', () => {
    const pack = getPackDefinition('pre-push');
    assert.strictEqual(pack.name, 'pre-push');
    assert.ok(pack.checks?.some((c) => c.id === 'protected-branches'));
  });

  test('returns a custom pack definition for unrecognized names', () => {
    const custom = getPackDefinition('unrecognized-custom-pack');
    assert.strictEqual(custom.name, 'unrecognized-custom-pack');
    assert.ok(custom.description.includes('unrecognized-custom-pack'));
  });

  test('KNOWN_PACK_NAMES lists canonical packs', () => {
    assert.ok(KNOWN_PACK_NAMES.includes('tdd'));
    assert.ok(KNOWN_PACK_NAMES.includes('boundaries'));
    assert.ok(KNOWN_PACK_NAMES.includes('coverage'));
  });
});

describe('installPack execution', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-pack-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('creates new harness.yaml when none exists', () => {
    const result = installPack(tmpDir, 'tdd');
    assert.strictEqual(result.alreadyInstalled, false);
    assert.ok(fs.existsSync(result.configPath));

    const cfg = parseHarnessConfig(fs.readFileSync(result.configPath, 'utf-8'));
    assert.deepStrictEqual(cfg.packs, ['tdd']);
    assert.strictEqual(cfg.methodology, 'tdd');
    assert.ok(cfg.checks.some((c) => c.id === 'red-before-green'));
  });

  test('is idempotent when pack is already installed', () => {
    installPack(tmpDir, 'tdd');
    const second = installPack(tmpDir, 'tdd');
    assert.strictEqual(second.alreadyInstalled, true);
    assert.strictEqual(second.actions.length, 0);
  });

  test('appends pack to existing harness.yaml with existing packs', () => {
    const configPath = path.join(tmpDir, 'harness.yaml');
    fs.writeFileSync(configPath, 'version: 1\npacks:\n  - clean-code\n', 'utf-8');

    const result = installPack(tmpDir, 'boundaries');
    assert.strictEqual(result.alreadyInstalled, false);

    const cfg = parseHarnessConfig(fs.readFileSync(configPath, 'utf-8'));
    assert.deepStrictEqual(cfg.packs, ['clean-code', 'boundaries']);
    assert.ok(cfg.checks.some((c) => c.id === 'layer-boundaries'));
  });

  test('appends pack to existing harness.yaml without packs section', () => {
    const configPath = path.join(tmpDir, 'harness.yaml');
    fs.writeFileSync(configPath, 'version: 1\nmethodology: none\n', 'utf-8');

    const result = installPack(tmpDir, 'coverage');
    assert.strictEqual(result.alreadyInstalled, false);

    const cfg = parseHarnessConfig(fs.readFileSync(configPath, 'utf-8'));
    assert.deepStrictEqual(cfg.packs, ['coverage']);
    assert.ok(cfg.checks.some((c) => c.id === 'coverage-floor'));
  });

  test('supports dry run mode without writing to disk', () => {
    const result = installPack(tmpDir, 'tdd', { dryRun: true });
    assert.strictEqual(result.alreadyInstalled, false);
    assert.strictEqual(fs.existsSync(result.configPath), false);
    assert.ok(result.actions.length > 0);
  });

  test('appends to flow list format packs: [a, b]', () => {
    const configPath = path.join(tmpDir, 'harness.yaml');
    fs.writeFileSync(configPath, 'version: 1\npacks: [clean-code]\n', 'utf-8');

    installPack(tmpDir, 'tdd');
    const cfg = parseHarnessConfig(fs.readFileSync(configPath, 'utf-8'));
    assert.deepStrictEqual(cfg.packs, ['clean-code', 'tdd']);
  });

  test('updates methodology none to tdd and installs check with params', () => {
    const configPath = path.join(tmpDir, 'harness.yaml');
    fs.writeFileSync(configPath, 'version: 1\nmethodology: none\n', 'utf-8');

    installPack(tmpDir, 'clean-code');
    const cfg = parseHarnessConfig(fs.readFileSync(configPath, 'utf-8'));
    assert.ok(cfg.checks.some((c) => c.id === 'max-file-lines' && c.params.max === 300));
  });

  test('detects existing harness.yml alternate config name', () => {
    const ymlPath = path.join(tmpDir, 'harness.yml');
    fs.writeFileSync(ymlPath, 'version: 1\npacks: []\n', 'utf-8');
    const res = installPack(tmpDir, 'docker');
    assert.strictEqual(res.configPath, ymlPath);
  });

  test('appends checks to existing checks section', () => {
    const configPath = path.join(tmpDir, 'harness.yaml');
    fs.writeFileSync(configPath, 'version: 1\nchecks:\n  - id: max-file-lines\n', 'utf-8');
    installPack(tmpDir, 'boundaries');
    const cfg = parseHarnessConfig(fs.readFileSync(configPath, 'utf-8'));
    assert.ok(cfg.checks.some((c) => c.id === 'layer-boundaries'));
  });

  test('appends to empty packs: section header and empty checks: section header', () => {
    const configPath = path.join(tmpDir, 'harness.yaml');
    fs.writeFileSync(configPath, 'version: 1\npacks:\nchecks:\n', 'utf-8');
    installPack(tmpDir, 'boundaries');
    const cfg = parseHarnessConfig(fs.readFileSync(configPath, 'utf-8'));
    assert.deepStrictEqual(cfg.packs, ['boundaries']);
    assert.ok(cfg.checks.some((c) => c.id === 'layer-boundaries'));
  });

  test('updates methodology none when installing tdd pack', () => {
    const configPath = path.join(tmpDir, 'harness.yaml');
    fs.writeFileSync(configPath, 'version: 1\nmethodology: none\n', 'utf-8');
    const res = installPack(tmpDir, 'tdd');
    assert.ok(res.actions.some((a) => a.includes('set methodology: tdd')));
    const cfg = parseHarnessConfig(fs.readFileSync(configPath, 'utf-8'));
    assert.strictEqual(cfg.methodology, 'tdd');
  });

  test('installs pre-push pack and writes .git/hooks/pre-push when git exists', () => {
    const gitHooksDir = path.join(tmpDir, '.git', 'hooks');
    fs.mkdirSync(gitHooksDir, { recursive: true });

    const res = installPack(tmpDir, 'pre-push');
    assert.ok(res.actions.some((a) => a.includes('install: .git/hooks/pre-push')));
    const hookFile = path.join(gitHooksDir, 'pre-push');
    assert.ok(fs.existsSync(hookFile));
    const content = fs.readFileSync(hookFile, 'utf-8');
    assert.ok(content.includes('azcodr'));
  });

  test('installs pre-push pack into harness without crashing when no .git exists', () => {
    const res = installPack(tmpDir, 'pre-push');
    assert.strictEqual(res.alreadyInstalled, false);
    assert.ok(fs.existsSync(res.configPath));
  });

  test('installs ci pack and writes .github/workflows/ci.yml', () => {
    const res = installPack(tmpDir, 'ci');
    assert.strictEqual(res.alreadyInstalled, false);
    assert.ok(res.actions.some((a) => a.includes('.github/workflows/ci.yml')));

    const ciFile = path.join(tmpDir, '.github', 'workflows', 'ci.yml');
    assert.ok(fs.existsSync(ciFile));
    const content = fs.readFileSync(ciFile, 'utf-8');
    assert.ok(content.includes('name: CI'));
    assert.ok(content.includes('azcodr check'));

    const cfg = parseHarnessConfig(fs.readFileSync(res.configPath, 'utf-8'));
    assert.ok(cfg.packs.includes('ci'));
  });

  test('installs publish-workflow pack and writes .github/workflows/publish.yml', () => {
    const res = installPack(tmpDir, 'publish-workflow');
    assert.strictEqual(res.alreadyInstalled, false);
    assert.ok(res.actions.some((a) => a.includes('.github/workflows/publish.yml')));

    const pubFile = path.join(tmpDir, '.github', 'workflows', 'publish.yml');
    assert.ok(fs.existsSync(pubFile));
    const content = fs.readFileSync(pubFile, 'utf-8');
    assert.ok(content.includes('name: Publish'));
    assert.ok(content.includes('azcodr check'));

    const cfg = parseHarnessConfig(fs.readFileSync(res.configPath, 'utf-8'));
    assert.ok(cfg.packs.includes('publish-workflow'));
  });

  test('skips overwriting existing custom workflow when force is false', () => {
    const wfDir = path.join(tmpDir, '.github', 'workflows');
    fs.mkdirSync(wfDir, { recursive: true });
    const ciFile = path.join(wfDir, 'ci.yml');
    const customContent = '# My Custom Workflow\nname: CustomCI\n';
    fs.writeFileSync(ciFile, customContent, 'utf-8');

    const res = installPack(tmpDir, 'ci');
    assert.strictEqual(res.alreadyInstalled, false);
    assert.strictEqual(fs.readFileSync(ciFile, 'utf-8'), customContent);
  });

  test('overwrites existing workflow when force is true', () => {
    const wfDir = path.join(tmpDir, '.github', 'workflows');
    fs.mkdirSync(wfDir, { recursive: true });
    const ciFile = path.join(wfDir, 'ci.yml');
    const customContent = '# My Custom Workflow\nname: CustomCI\n';
    fs.writeFileSync(ciFile, customContent, 'utf-8');

    const res = installPack(tmpDir, 'ci', { force: true });
    assert.strictEqual(res.alreadyInstalled, false);
    assert.ok(res.actions.some((a) => a.includes('.github/workflows/ci.yml')));
    const newContent = fs.readFileSync(ciFile, 'utf-8');
    assert.ok(newContent.includes('name: CI'));
  });

  test('supports dry-run mode for ci pack without writing workflow file', () => {
    const res = installPack(tmpDir, 'ci', { dryRun: true });
    assert.strictEqual(res.alreadyInstalled, false);
    assert.ok(res.actions.some((a) => a.includes('.github/workflows/ci.yml')));

    const ciFile = path.join(tmpDir, '.github', 'workflows', 'ci.yml');
    assert.strictEqual(fs.existsSync(ciFile), false);
    assert.strictEqual(fs.existsSync(res.configPath), false);
  });
});

