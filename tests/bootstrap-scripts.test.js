/**
 * Regression tests for bootstrap_workspace.sh.
 *
 * THE BUG THIS GUARDS: the script overwrote memory.md with a heredoc whenever
 * the file contained any ADR heading that was not the untouched template
 * placeholder. Re-running /lets-build on a live project therefore DESTROYED
 * every recorded architectural decision -- including decisions that
 * product-analyst had just been handed to record.
 *
 * Every test here runs the real script against a real temporary workspace and
 * asserts on the resulting file contents.
 */
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

function runBootstrap(root, topology = 'backend', language = 'typescript') {
  const r = spawnSync(bash, [SCRIPT, root, topology, language], {
    encoding: 'utf-8',
    timeout: 30000
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

describe('bootstrap_workspace.sh: NEVER destroys recorded ADRs', { skip }, () => {
  let root;
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
    // Explicitly assert the irreversible-looking failures.
    assert.match(after, /Chose Postgres over MySQL/);
    assert.match(after, /ADR-002: Adopted hexagonal architecture/);
  });

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

  test('creates a clean slate only when memory.md is absent', () => {
    const r = runBootstrap(root);
    assert.strictEqual(r.code, 0, r.out);
    // Nothing to destroy: the script should not invent a ledger.
    assert.strictEqual(
      fs.existsSync(path.join(root, 'memory.md')),
      false,
      'bootstrap must not fabricate memory.md'
    );
  });

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

describe('bootstrap_workspace.sh: honours an explicit opt-in', { skip }, () => {
  let root;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-boot-opt-'));
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('AZCODR_RESET_MEMORY=1 resets, and writes a backup first', () => {
    const memoryPath = path.join(root, 'memory.md');
    fs.writeFileSync(memoryPath, LIVE_MEMORY);

    const r = spawnSync(bash, [SCRIPT, root, 'backend', 'typescript'], {
      encoding: 'utf-8',
      timeout: 30000,
      env: { ...process.env, AZCODR_RESET_MEMORY: '1' }
    });
    assert.strictEqual(r.status, 0, `${r.stdout}${r.stderr}`);

    // A destructive action must leave a recoverable copy.
    const backup = path.join(root, 'memory.md.bak');
    assert.ok(fs.existsSync(backup), 'reset must create memory.md.bak before overwriting');
    const backed = fs.readFileSync(backup, 'utf-8');
    assert.match(backed, /Chose Postgres over MySQL/, 'backup must contain the original ADRs');
    assert.match(
      `${r.stdout || ''}${r.stderr || ''}`,
      /RESETTING/,
      'a destructive reset must be announced'
    );
    // And the reset must actually have happened.
    assert.match(fs.readFileSync(memoryPath, 'utf-8'), /No decisions recorded yet/);
  });

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

describe('bootstrap_workspace.sh: topology dispatch is deterministic', { skip }, () => {
  let root;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-boot-topo-'));
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('rejects an unknown topology instead of silently scaffolding generic', () => {
    // SKILL.md enumerates Topologies A-F; D (canvas game) and F (systems
    // library) previously fell through to the generic branch and exited 0,
    // producing a wrong-but-successful scaffold.
    const r = runBootstrap(root, 'quantum-mesh');
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
    const r = runBootstrap(root, 'backend', 'cobol');
    assert.notStrictEqual(r.code, 0, `unknown language must fail:\n${r.out}`);
    assert.match(r.out, /[Uu]nknown language profile/);
    assert.strictEqual(
      fs.existsSync(path.join(root, 'src')),
      false,
      'a rejected language must not scaffold a tree'
    );
  });

  test('records the decided profile so downstream phases can read it', () => {
    const r = runBootstrap(root, 'backend', 'rust');
    assert.strictEqual(r.code, 0, r.out);
    const profile = path.join(root, '.azcodr', 'workspace-profile.env');
    assert.ok(fs.existsSync(profile), 'profile must be recorded');
    const body = fs.readFileSync(profile, 'utf-8');
    assert.match(body, /^topology=backend$/m);
    assert.match(body, /^language=rust$/m);
  });

  test('supports the documented canvas-game topology', () => {
    const r = runBootstrap(root, 'canvas-game');
    assert.strictEqual(r.code, 0, r.out);
    // Game-loop shaped: entities + update/render systems + input.
    assert.ok(fs.existsSync(path.join(root, 'src', 'entities')));
    assert.ok(fs.existsSync(path.join(root, 'src', 'systems', 'update')));
    assert.ok(fs.existsSync(path.join(root, 'src', 'systems', 'render')));
    assert.ok(fs.existsSync(path.join(root, 'src', 'input')));
  });

  test('supports the documented systems-library topology', () => {
    const r = runBootstrap(root, 'systems-library');
    assert.strictEqual(r.code, 0, r.out);
    assert.ok(fs.existsSync(path.join(root, 'src', 'core')));
  });

  test('a known topology still scaffolds its tree', () => {
    const r = runBootstrap(root, 'cli');
    assert.strictEqual(r.code, 0, r.out);
    assert.ok(fs.existsSync(path.join(root, 'src', 'cmd')));
  });

  test('the language argument is not silently ignored', () => {
    // $LANGUAGE was accepted and echoed but never used: the "deterministic"
    // scaffolder produced an identical tree for every language.
    const r = runBootstrap(root, 'backend', 'rust');
    assert.match(r.out, /rust/i, 'the language argument must be reflected in output');
  });
});