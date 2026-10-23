import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  bootstrapWorkspace,
  SUPPORTED_LANGUAGES,
  TOPOLOGY_ALIASES
} from '../src/topology.js';
import { scaffold } from '../src/scaffold.js';

let tmpDir: string;

function setUpTmp() {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-topology-test-'));
}

function tearDownTmp() {
  if (tmpDir && fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

describe('Unified Topology Engine: constants and aliases', () => {
  test('exports canonical supported languages and topology aliases', () => {
    assert.ok(SUPPORTED_LANGUAGES.includes('typescript'));
    assert.ok(SUPPORTED_LANGUAGES.includes('python'));
    assert.ok(SUPPORTED_LANGUAGES.includes('rust'));
    assert.ok(SUPPORTED_LANGUAGES.includes('generic'));

    assert.strictEqual(TOPOLOGY_ALIASES.emergent, 'emergent');
    assert.strictEqual(TOPOLOGY_ALIASES.custom, 'emergent');
    assert.strictEqual(TOPOLOGY_ALIASES.dynamic, 'emergent');
    assert.strictEqual(TOPOLOGY_ALIASES.backend, 'backend');
    assert.strictEqual(TOPOLOGY_ALIASES.fullstack, 'fullstack');
  });
});

describe('Unified Topology Engine: emergent architecture', () => {
  beforeEach(setUpTmp);
  afterEach(tearDownTmp);

  test('emergent topology scaffolds minimal test harness without rigid domain folders', () => {
    const logs: string[] = [];
    const res = bootstrapWorkspace(tmpDir, {
      topology: 'emergent',
      language: 'typescript',
      out: (msg) => logs.push(msg)
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.topology, 'emergent');
    assert.strictEqual(res.language, 'typescript');

    const profileFile = path.join(tmpDir, '.azcodr', 'workspace-profile.env');
    assert.ok(fs.existsSync(profileFile));
    const profile = fs.readFileSync(profileFile, 'utf-8');
    assert.match(profile, /topology=emergent/);
    assert.match(profile, /language=typescript/);

    assert.ok(fs.existsSync(path.join(tmpDir, 'tests', 'unit')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'tests', 'integration')));

    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'src', 'domain')), false);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'src', 'cmd')), false);

    assert.ok(fs.existsSync(path.join(tmpDir, 'eslint.config.js')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'scripts', 'smoke_test.mjs')));
  });

  test('emergent architecture with python emits ruff configuration', () => {
    const res = bootstrapWorkspace(tmpDir, {
      topology: 'emergent',
      language: 'python'
    });

    assert.strictEqual(res.success, true);
    assert.ok(fs.existsSync(path.join(tmpDir, 'ruff.toml')));
    const ruff = fs.readFileSync(path.join(tmpDir, 'ruff.toml'), 'utf-8');
    assert.match(ruff, /max-complexity = 10/);
  });
});

describe('Unified Topology Engine: presets as accelerators', () => {
  beforeEach(setUpTmp);
  afterEach(tearDownTmp);

  test('backend preset scaffolds hexagonal ports and adapters', () => {
    const res = bootstrapWorkspace(tmpDir, {
      topology: 'backend',
      language: 'typescript'
    });

    assert.strictEqual(res.success, true);
    assert.ok(fs.existsSync(path.join(tmpDir, 'src', 'domain', 'entities')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'src', 'ports', 'primary')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'src', 'adapters', 'secondary')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'specs', 'tokens', 'tokens.json')));
  });

  test('cli preset scaffolds cmd, core, and io folders', () => {
    const res = bootstrapWorkspace(tmpDir, {
      topology: 'cli',
      language: 'rust'
    });

    assert.strictEqual(res.success, true);
    assert.ok(fs.existsSync(path.join(tmpDir, 'src', 'cmd')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'src', 'core')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'src', 'io')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'clippy.toml')));
  });
});

describe('Unified Topology Engine: scaffold() integration', () => {
  beforeEach(setUpTmp);
  afterEach(tearDownTmp);

  test('scaffold() automatically orchestrates governance and emergent topology', () => {
    const result = scaffold({
      targetDir: tmpDir,
      noGit: true,
      topology: 'emergent',
      language: 'typescript'
    });

    assert.strictEqual(result.success, true);
    assert.ok(fs.existsSync(path.join(tmpDir, 'AGENTS.md')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'memory.md')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.editorconfig')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.azcodr', 'workspace-profile.env')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'eslint.config.js')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'tests', 'unit')));
  });
});
