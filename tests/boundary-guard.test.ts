/**
 * Boundary guard regression tests (ADR-021).
 * Locks: (1) the vendored engine is byte-identical to the built lib engine,
 * (2) the runner is a deterministic 0/1 verdict machine, (3) it fails CLOSED
 * (exit 2) when no engine can be resolved, and (4) --silent suppresses the
 * report but keeps the verdict.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const GUARD_SCRIPT = path.join(REPO_ROOT, '.agents', 'scripts', 'boundary_guard.js');

let tmpDir: string;
beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-boundary-guard-'));
});

afterEach(() => {
  if (tmpDir && fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

function writeFixture(dir: string, files: Record<string, string>) {
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf-8');
  }
}

function runGuard(args: string[], opts: { cwd?: string; env?: NodeJS.ProcessEnv } = {}) {
  let exitCode: number | null = null;
  let stdout = '';
  let stderr = '';
  try {
    stdout = execFileSync(process.execPath, [GUARD_SCRIPT, ...args], {
      encoding: 'utf-8',
      cwd: opts.cwd ?? REPO_ROOT,
      env: opts.env ? { ...process.env, ...opts.env } : undefined,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    exitCode = 0;
  } catch (err: any) {
    exitCode = err.status;
    stdout = err.stdout ?? '';
    stderr = err.stderr ?? '';
  }
  return { exitCode, stdout, stderr };
}

describe('Boundary guard: vendored engine parity', () => {
  test('vendored engine ships inside .agents and matches lib output', () => {
    const vendored = fs.readFileSync(path.join(REPO_ROOT, '.agents', 'lib', 'boundaries.js'), 'utf-8');
    const built = fs.readFileSync(path.join(REPO_ROOT, 'lib', 'boundaries.js'), 'utf-8');
    assert.strictEqual(
      vendored,
      built,
      `.agents/lib/boundaries.js must equal lib/boundaries.js; re-copy after npm run build`
    );
  });
});

describe('Boundary guard: verdict exits', () => {
  test('exits 0 with a clean report on a drift-free tree', () => {
    const fixture = path.join(tmpDir, 'clean');
    writeFixture(fixture, {
      'src/domain.ts': 'export const domain = 1;',
      'src/infra.ts': "import './domain.js';\nexport const use = (d) => d + 1;"
    });
    const { exitCode, stdout } = runGuard([fixture]);
    assert.strictEqual(exitCode, 0);
    assert.match(stdout, /No cycles or boundary violations/);
    assert.match(stdout, /module\(s\)/);
  });

  test('exits 1 and reports a circular dependency on a drifting tree', () => {
    const fixture = path.join(tmpDir, 'cycle');
    writeFixture(fixture, {
      'src/billing.ts': "import './tenant.js';\nexport const getTier = () => 'pro';",
      'src/tenant.ts': "import './billing.js';\nexport const getTenant = () => ({ id: '1' });"
    });
    const { exitCode, stderr } = runGuard([fixture]);
    assert.strictEqual(exitCode, 1);
    assert.match(stderr, /Circular Dependency/);
  });

  test('exits 1 and reports a layer boundary breach', () => {
    const fixture = path.join(tmpDir, 'breach');
    writeFixture(fixture, {
      'src/infrastructure/db.ts': 'export const query = () => [];',
      'src/domain/payment.ts': "import '../infrastructure/db.js';\nexport const reconcile = () => true;"
    });
    const { exitCode, stderr } = runGuard([fixture]);
    assert.strictEqual(exitCode, 1);
    assert.match(stderr, /Layer Boundary Breach/);
    assert.match(stderr, /domain .* -> .*infrastructur|infrastructur/);
  });

  test('--silent suppresses the report but keeps the 0/1 verdict', () => {
    const clean = path.join(tmpDir, 'clean-silent');
    writeFixture(clean, { 'src/a.ts': 'export const a = 1;' });
    const cleanRun = runGuard(['--silent', clean]);
    assert.strictEqual(cleanRun.exitCode, 0);
    assert.strictEqual(cleanRun.stdout.trim(), '');

    const drifting = path.join(tmpDir, 'drifting-silent');
    writeFixture(drifting, {
      'src/billing.ts': "import './tenant.js';\nexport const getTier = () => 'pro';",
      'src/tenant.ts': "import './billing.js';\nexport const getTenant = () => ({ id: '1' });"
    });
    const driftRun = runGuard(['--silent', drifting]);
    assert.strictEqual(driftRun.exitCode, 1);
    assert.strictEqual(driftRun.stdout.trim(), '');
  });
});

describe('Boundary guard: target resolution', () => {
  test('falls back to cwd/src when no positional target is given', () => {
    const cwd = path.join(tmpDir, 'fallback-src');
    writeFixture(cwd, { 'src/a.ts': 'export const a = 1;' });
    const { exitCode } = runGuard(['--silent'], { cwd });
    assert.strictEqual(exitCode, 0);
  });

  test('falls back to cwd when no src/ directory exists', () => {
    const cwd = path.join(tmpDir, 'fallback-cwd');
    writeFixture(cwd, { 'top.ts': 'export const top = 1;' });
    const { exitCode } = runGuard(['--silent'], { cwd });
    assert.strictEqual(exitCode, 0);
  });
});

describe('Boundary guard: fails closed', () => {
  test('exits 2 with a diagnostic when no engine can be resolved', () => {
    // Deep-nest the runner so neither ../lib nor ../../lib exists next to it.
    const fakeRoot = path.join(tmpDir, 'no-engine', 'nested', 'deep');
    fs.mkdirSync(fakeRoot, { recursive: true });
    fs.copyFileSync(GUARD_SCRIPT, path.join(fakeRoot, 'boundary_guard.js'));

    let exitCode: number | null = null;
    let stderr = '';
    try {
      execFileSync(process.execPath, [path.join(fakeRoot, 'boundary_guard.js'), '--silent'], {
        encoding: 'utf-8',
        cwd: fakeRoot,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      exitCode = 0;
    } catch (err: any) {
      exitCode = err.status;
      stderr = err.stderr ?? '';
    }
    assert.strictEqual(exitCode, 2);
    assert.match(stderr, /engine module not found/);
    assert.match(stderr, /Tried:/);
  });

  test('resolves the engine from AZCODR_BOUNDARY_ENGINE when vendored paths are absent', () => {
    // Deep-nest the runner so ../lib and ../../lib do not exist; with the
    // override set, the engine must still resolve and produce a verdict.
    const fakeRoot = path.join(tmpDir, 'override-engine', 'nested', 'deep');
    fs.mkdirSync(fakeRoot, { recursive: true });
    fs.copyFileSync(GUARD_SCRIPT, path.join(fakeRoot, 'boundary_guard.js'));
    const realEngine = path.join(REPO_ROOT, '.agents', 'lib', 'boundaries.js');

    const fixture = path.join(tmpDir, 'override-clean');
    writeFixture(fixture, { 'src/domain.ts': 'export const d = 1;' });

    let exitCode: number | null = null;
    try {
      execFileSync(process.execPath, [path.join(fakeRoot, 'boundary_guard.js'), '--silent', fixture], {
        encoding: 'utf-8',
        cwd: fakeRoot,
        env: { ...process.env, AZCODR_BOUNDARY_ENGINE: realEngine },
        stdio: ['ignore', 'pipe', 'pipe']
      });
      exitCode = 0;
    } catch (err: any) {
      exitCode = err.status;
    }
    assert.strictEqual(exitCode, 0);
  });
});