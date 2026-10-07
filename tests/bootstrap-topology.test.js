const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const SCRIPT = path.resolve(
  __dirname, '..', '.agents', 'skills', 'lets-build', 'scripts', 'bootstrap_workspace.sh'
);

function findBash() {
  const candidates = [
    'C:\\Program Files\\Git\\bin\\bash.exe',
    'C:\\Program Files\\Git\\usr\\bin\\bash.exe'
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  const probe = spawnSync('bash', ['--version'], { encoding: 'utf-8' });
  return probe.status === 0 ? 'bash' : null;
}

const bash = findBash();
const skip = bash ? false : 'bash not available';

function runBootstrap(root, options = {}) {
  const { topology = 'backend', language = 'typescript', extraEnv = {} } = options;
  const r = spawnSync(bash, [SCRIPT, root, topology, language], {
    encoding: 'utf-8',
    timeout: 30000,
    env: { ...process.env, ...extraEnv }
  });
  return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
}

describe('bootstrap topology: rejects unknowns', { skip }, () => {
  let root;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-boot-topo-'));
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('rejects an unknown topology instead of silently scaffolding generic', () => {
    const r = runBootstrap(root, { topology: 'quantum-mesh' });
    assert.notStrictEqual(r.code, 0, `unknown topology must fail, not fall back:\n${r.out}`);
    assert.match(r.out, /[Uu]nknown topology/);
    assert.match(r.out, /Supported topologies:/);
    assert.strictEqual(
      fs.existsSync(path.join(root, 'src')),
      false,
      'a rejected topology must not create a generic tree'
    );
  });

  test('rejects an unknown language profile instead of echoing it', () => {
    const r = runBootstrap(root, { topology: 'backend', language: 'cobol' });
    assert.notStrictEqual(r.code, 0, `unknown language must fail:\n${r.out}`);
    assert.match(r.out, /[Uu]nknown language profile/);
    assert.strictEqual(
      fs.existsSync(path.join(root, 'src')),
      false,
      'a rejected language must not scaffold a tree'
    );
  });
});

describe('bootstrap topology: records profile', { skip }, () => {
  let root;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-boot-topo-'));
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('records the decided profile so downstream phases can read it', () => {
    const r = runBootstrap(root, { topology: 'backend', language: 'rust' });
    assert.strictEqual(r.code, 0, r.out);
    const profile = path.join(root, '.azcodr', 'workspace-profile.env');
    assert.ok(fs.existsSync(profile), 'profile must be recorded');
    const body = fs.readFileSync(profile, 'utf-8');
    assert.match(body, /^topology=backend$/m);
    assert.match(body, /^language=rust$/m);
  });

  test('supports the documented canvas-game topology', () => {
    const r = runBootstrap(root, { topology: 'canvas-game' });
    assert.strictEqual(r.code, 0, r.out);
    assert.ok(fs.existsSync(path.join(root, 'src', 'entities')));
    assert.ok(fs.existsSync(path.join(root, 'src', 'systems', 'update')));
    assert.ok(fs.existsSync(path.join(root, 'src', 'systems', 'render')));
    assert.ok(fs.existsSync(path.join(root, 'src', 'input')));
  });
});

describe('bootstrap topology: known trees', { skip }, () => {
  let root;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-boot-topo-'));
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('supports the documented systems-library topology', () => {
    const r = runBootstrap(root, { topology: 'systems-library' });
    assert.strictEqual(r.code, 0, r.out);
    assert.ok(fs.existsSync(path.join(root, 'src', 'core')));
  });

  test('a known topology still scaffolds its tree', () => {
    const r = runBootstrap(root, { topology: 'cli' });
    assert.strictEqual(r.code, 0, r.out);
    assert.ok(fs.existsSync(path.join(root, 'src', 'cmd')));
  });
});

describe('bootstrap language: reflected in output', { skip }, () => {
  let root;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-boot-topo-'));
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('the language argument is not silently ignored', () => {
    const r = runBootstrap(root, { topology: 'backend', language: 'rust' });
    assert.match(r.out, /rust/i, 'the language argument must be reflected in output');
  });
});
