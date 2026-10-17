import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(
  __dirname, '..', '.agents', 'skills', 'lets-build', 'scripts', 'bootstrap_workspace.mjs'
);

interface BootstrapOptions {
  topology?: string;
  language?: string;
  extraEnv?: Record<string, string>;
}

function runBootstrap(root: string, options: BootstrapOptions = {}) {
  const { topology = 'backend', language = 'typescript', extraEnv = {} } = options;
  const r = spawnSync(process.execPath, [SCRIPT, root, topology, language], {
    encoding: 'utf-8',
    timeout: 30000,
    env: { ...process.env, ...extraEnv }
  });
  return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
}

describe('bootstrap guard: root and home', () => {
  let root: string;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-boot-guard-'));
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('refuses the filesystem root without creating anything', () => {
    const r = runBootstrap('/', { topology: 'backend', language: 'typescript' });
    assert.notStrictEqual(r.code, 0, `root must be refused:\n${r.out}`);
    assert.match(r.out, /protected/i);
  });

  test('refuses the home directory parent', () => {
    const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-fakehome-'));
    try {
      const parent = path.dirname(fakeHome);
      const opts = { topology: 'backend', language: 'typescript', extraEnv: { HOME: fakeHome } };
      const r = runBootstrap(parent, opts);
      assert.notStrictEqual(r.code, 0, `home parent must be refused:\n${r.out}`);
      assert.match(r.out, /protected/i);
    } finally {
      fs.rmSync(fakeHome, { recursive: true, force: true });
    }
  });
});

describe('bootstrap guard: home directory', () => {
  let root: string;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-boot-guard-'));
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('refuses the home directory without creating anything', () => {
    const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-fakehome-'));
    try {
      const opts = { topology: 'backend', language: 'typescript', extraEnv: { HOME: fakeHome } };
      const r = runBootstrap(fakeHome, opts);
      assert.notStrictEqual(r.code, 0, `home must be refused:\n${r.out}`);
      assert.match(r.out, /protected/i);
      assert.deepStrictEqual(
        [...fs.readdirSync(fakeHome)],
        [],
        'a refused target must be left completely untouched'
      );
    } finally {
      fs.rmSync(fakeHome, { recursive: true, force: true });
    }
  });
});

describe('bootstrap guard: bypass and normal', () => {
  let root: string;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-boot-guard-'));
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('AZCODR_ALLOW_PROTECTED=1 bypasses the guard for embedders', () => {
    const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-fakehome-'));
    try {
      const extraEnv = { HOME: fakeHome, AZCODR_ALLOW_PROTECTED: '1' };
      const opts = { topology: 'backend', language: 'typescript', extraEnv };
      const r = runBootstrap(fakeHome, opts);
      assert.strictEqual(r.code, 0, r.out);
      assert.ok(fs.existsSync(path.join(fakeHome, 'src', 'domain')));
    } finally {
      fs.rmSync(fakeHome, { recursive: true, force: true });
    }
  });

  test('a normal subdirectory still scaffolds', () => {
    const target = path.join(root, 'my-project');
    const r = runBootstrap(target, { topology: 'backend', language: 'typescript' });
    assert.strictEqual(r.code, 0, r.out);
    assert.ok(fs.existsSync(path.join(target, 'src', 'domain')));
  });
});
