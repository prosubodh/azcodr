import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
const describeSuite = skip ? describe.skip : describe;

interface BootstrapOptions {
  topology?: string;
  language?: string;
  extraEnv?: Record<string, string>;
}

function runBootstrap(root: string, options: BootstrapOptions = {}) {
  const { topology = 'backend', language = 'typescript', extraEnv = {} } = options;
  const r = spawnSync(bash!, [SCRIPT, root, topology, language], {
    encoding: 'utf-8',
    timeout: 30000,
    env: { ...process.env, ...extraEnv }
  });
  return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
}

const LIVE_MEMORY = [
  '# Workspace Memory',
  '',
  '### ADR Master Index',
  '',
  '| ID | Title | Date | Status |',
  '|---|---|---|---|',
  '| ADR-001 | Chose Postgres over MySQL | 2026-02-01 | ACCEPTED |',
  '| ADR-002 | Adopted hexagonal architecture | 2026-02-03 | ACCEPTED |',
  '',
  '#### ADR-001: Chose Postgres over MySQL',
  '- **Date:** 2026-02-01 | **Status:** ACCEPTED',
  '- **Context:** We needed strong transactional guarantees.',
  '- **Decision:** Use PostgreSQL 16 with logical replication.',
  '- **Consequences:** We accept the operational cost of connection pooling.',
  '- **Enforced In:** src/adapters/secondary',
  '',
  '#### ADR-002: Adopted hexagonal architecture',
  '- **Date:** 2026-02-03 | **Status:** ACCEPTED',
  '- **Decision:** Ports and adapters, dependency inversion at the core.',
  '- **Consequences:** More indirection; testable core.',
  '- **Enforced In:** src/ports/',
  ''
].join('\n');

describeSuite('bootstrap: preserves a live memory verbatim', () => {
  let root: string;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-boot-'));
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('preserves a live memory.md with real ADRs verbatim', () => {
    const memoryPath = path.join(root, 'memory.md');
    fs.writeFileSync(memoryPath, LIVE_MEMORY);
    const r = runBootstrap(root);
    assert.strictEqual(r.code, 0, r.out);
    const after = fs.readFileSync(memoryPath, 'utf-8');
    assert.strictEqual(
      after,
      LIVE_MEMORY,
      'memory.md was modified. Recorded architectural decisions must never be destroyed.'
    );
    assert.match(after, /Chose Postgres over MySQL/);
    assert.match(after, /ADR-002: Adopted hexagonal architecture/);
  });
});

describeSuite('bootstrap: preserves high numbering', () => {
  let root: string;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-boot-'));
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('preserves ADRs even when numbering is high', () => {
    const memoryPath = path.join(root, 'memory.md');
    const many = ['# Workspace Memory', '', '### ADR Master Index', ''];
    for (let i = 1; i <= 30; i += 1) {
      many.push(`| ADR-${String(i).padStart(3, '0')} | Decision ${i} | 2026-01-01 | ACCEPTED |`);
    }
    many.push('', '#### ADR-030: The thirtieth decision', '- **Decision:** keep me');
    fs.writeFileSync(memoryPath, `${many.join('\n')}\n`);
    runBootstrap(root);
    const after = fs.readFileSync(memoryPath, 'utf-8');
    assert.match(after, /ADR-030: The thirtieth decision/);
    assert.match(after, /keep me/);
  });
});

describeSuite('bootstrap: idempotent across runs', () => {
  let root: string;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-boot-'));
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('is idempotent across repeated runs', () => {
    const memoryPath = path.join(root, 'memory.md');
    fs.writeFileSync(memoryPath, LIVE_MEMORY);
    runBootstrap(root);
    const first = fs.readFileSync(memoryPath, 'utf-8');
    runBootstrap(root);
    runBootstrap(root);
    const third = fs.readFileSync(memoryPath, 'utf-8');
    assert.strictEqual(third, first, 'repeated runs mutated memory.md');
    assert.strictEqual(third, LIVE_MEMORY);
  });
});

describeSuite('bootstrap: clean slate when absent', () => {
  let root: string;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-boot-'));
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('creates a clean slate only when memory.md is absent', () => {
    const r = runBootstrap(root);
    assert.strictEqual(r.code, 0, r.out);
    assert.strictEqual(
      fs.existsSync(path.join(root, 'memory.md')),
      false,
      'bootstrap must not fabricate memory.md'
    );
  });
});

describeSuite('bootstrap: untouched template alone', () => {
  let root: string;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-boot-'));
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('leaves an untouched template memory.md alone', () => {
    const memoryPath = path.join(root, 'memory.md');
    const template = [
      '# Workspace Memory',
      '',
      '### ADR Master Index',
      '',
      '| ID | Title | Date | Status |',
      '|---|---|---|---|',
      '| *(No decisions recorded yet)* | *Record during /lets-build.* | | |',
      ''
    ].join('\n');
    fs.writeFileSync(memoryPath, template);
    runBootstrap(root);
    assert.strictEqual(fs.readFileSync(memoryPath, 'utf-8'), template);
  });
});

describeSuite('bootstrap: explicit reset opt-in', () => {
  let root: string;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-boot-opt-'));
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('AZCODR_RESET_MEMORY=1 resets, and writes a backup first', () => {
    const memoryPath = path.join(root, 'memory.md');
    fs.writeFileSync(memoryPath, LIVE_MEMORY);
    const r = spawnSync(bash!, [SCRIPT, root, 'backend', 'typescript'], {
      encoding: 'utf-8',
      timeout: 30000,
      env: { ...process.env, AZCODR_RESET_MEMORY: '1' }
    });
    assert.strictEqual(r.status, 0, `${r.stdout}${r.stderr}`);
    const backup = path.join(root, 'memory.md.bak');
    assert.ok(fs.existsSync(backup), 'reset must create memory.md.bak before overwriting');
    const backed = fs.readFileSync(backup, 'utf-8');
    assert.match(backed, /Chose Postgres over MySQL/, 'backup must contain the original ADRs');
    assert.match(
      `${r.stdout || ''}${r.stderr || ''}`,
      /RESETTING/,
      'a destructive reset must be announced'
    );
    assert.match(fs.readFileSync(memoryPath, 'utf-8'), /No decisions recorded yet/);
  });
});

describeSuite('bootstrap: no litter without reset', () => {
  let root: string;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-boot-opt-'));
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('no backup file is left behind when no reset occurs', () => {
    const memoryPath = path.join(root, 'memory.md');
    fs.writeFileSync(memoryPath, LIVE_MEMORY);
    runBootstrap(root);
    assert.strictEqual(
      fs.existsSync(path.join(root, 'memory.md.bak')),
      false,
      'a normal run must not litter the workspace with backups'
    );
  });
});
