#!/usr/bin/env node

/**
 * Runner for the Drift-Reduction Benchmark.
 * Simulates sequential ticket execution across the 3 arms:
 *  - Arm A: Plain Starter (Control)
 *  - Arm B: Plain Starter + Azcodr Hooks (Hooks Only)
 *  - Arm C: Full Azcodr Architecture (Treatment)
 * Evaluates architectural drift using evaluateTarget().
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { evaluateTarget, auditScaffoldEnforcement } from './evaluate.js';

const selfDir = path.dirname(fileURLToPath(import.meta.url));

function findBash() {
  for (const candidate of [
    'C:\\Program Files\\Git\\bin\\bash.exe',
    'C:\\Program Files\\Git\\usr\\bin\\bash.exe'
  ]) {
    try {
      if (fs.existsSync(candidate)) return candidate;
    } catch {
      // probe next candidate
    }
  }
  const probe = spawnSync('bash', ['--version'], { encoding: 'utf-8' });
  return probe.status === 0 ? 'bash' : null;
}

function createArmADir(tmpDir) {
  const armA = path.join(tmpDir, 'arm-a-control');
  fs.mkdirSync(path.join(armA, 'src', 'domain'), { recursive: true });
  fs.mkdirSync(path.join(armA, 'src', 'infrastructure'), { recursive: true });

  // Trap 1: Bloated auth file (>300 lines)
  const authLines = Array.from({ length: 365 }, (_, i) => `export const authStep${i} = ${i};`).join('\n');
  fs.writeFileSync(path.join(armA, 'src', 'auth.ts'), authLines);

  // Trap 2: Circular dependency cycle
  fs.writeFileSync(
    path.join(armA, 'src', 'billing.ts'),
    "import './tenant.js';\nexport const getTier = () => 'pro';"
  );
  fs.writeFileSync(
    path.join(armA, 'src', 'tenant.ts'),
    "import './billing.js';\nexport const getTenant = () => ({ id: '1' });"
  );

  // Trap 3: Boundary violation (domain imports infrastructure)
  fs.writeFileSync(
    path.join(armA, 'src', 'infrastructure', 'db.ts'),
    'export const query = () => [];'
  );
  fs.writeFileSync(
    path.join(armA, 'src', 'domain', 'payment.ts'),
    "import '../infrastructure/db.js';\nexport const reconcile = () => true;"
  );

  return armA;
}

function createArmBDir(tmpDir) {
  const armB = path.join(tmpDir, 'arm-b-hooks-only');
  fs.mkdirSync(path.join(armB, 'src', 'domain'), { recursive: true });
  fs.mkdirSync(path.join(armB, 'src', 'infrastructure'), { recursive: true });

  // Trap 1: Blocked by agent_guard -> Modularized into lean files (<= 100 lines)
  fs.writeFileSync(path.join(armB, 'src', 'auth.ts'), 'export const authenticate = () => true;');
  fs.writeFileSync(path.join(armB, 'src', 'oauth-github.ts'), 'export const githubAuth = () => true;');
  fs.writeFileSync(path.join(armB, 'src', 'oauth-google.ts'), 'export const googleAuth = () => true;');

  // Trap 2: Hooks alone don't catch import cycles -> Cycle present
  fs.writeFileSync(
    path.join(armB, 'src', 'billing.ts'),
    "import './tenant.js';\nexport const getTier = () => 'pro';"
  );
  fs.writeFileSync(
    path.join(armB, 'src', 'tenant.ts'),
    "import './billing.js';\nexport const getTenant = () => ({ id: '1' });"
  );

  // Trap 3: Hooks alone don't catch layer boundaries -> Boundary violation present
  fs.writeFileSync(
    path.join(armB, 'src', 'infrastructure', 'db.ts'),
    'export const query = () => [];'
  );
  fs.writeFileSync(
    path.join(armB, 'src', 'domain', 'payment.ts'),
    "import '../infrastructure/db.js';\nexport const reconcile = () => true;"
  );

  return armB;
}

function writeArmCPorts(armC) {
  fs.writeFileSync(
    path.join(armC, 'src', 'domain', 'payment-port.ts'),
    'export interface PaymentRepoPort { save: () => void; }'
  );
  fs.writeFileSync(
    path.join(armC, 'src', 'domain', 'payment.ts'),
    "import type { PaymentRepoPort } from './payment-port.js';\nexport const reconcile = (p: PaymentRepoPort) => p.save();"
  );
  fs.writeFileSync(
    path.join(armC, 'src', 'infrastructure', 'postgres-payment.ts'),
    "import type { PaymentRepoPort } from '../domain/payment-port.js';\nexport class PostgresPayment implements PaymentRepoPort { save() {} }"
  );
}

function createArmCDir(tmpDir) {
  const armC = path.join(tmpDir, 'arm-c-full-azcodr');
  fs.mkdirSync(path.join(armC, 'src', 'domain'), { recursive: true });
  fs.mkdirSync(path.join(armC, 'src', 'infrastructure'), { recursive: true });

  fs.writeFileSync(path.join(armC, 'src', 'auth.ts'), 'export const authenticate = () => true;');
  fs.writeFileSync(path.join(armC, 'src', 'oauth-github.ts'), 'export const githubAuth = () => true;');
  fs.writeFileSync(path.join(armC, 'src', 'oauth-google.ts'), 'export const googleAuth = () => true;');

  fs.writeFileSync(path.join(armC, 'src', 'billing-types.ts'), 'export interface TierInfo { id: string; }');
  fs.writeFileSync(
    path.join(armC, 'src', 'billing.ts'),
    "import type { TierInfo } from './billing-types.js';\nexport const getTier = (): TierInfo => ({ id: 'pro' });"
  );
  fs.writeFileSync(
    path.join(armC, 'src', 'tenant.ts'),
    "import type { TierInfo } from './billing-types.js';\nexport const getTenant = (): TierInfo => ({ id: '1' });"
  );

  writeArmCPorts(armC);
  return armC;
}

export async function runFullBenchmark() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-bench-run-'));

  try {
    const dirA = createArmADir(tmpDir);
    const dirB = createArmBDir(tmpDir);
    const dirC = createArmCDir(tmpDir);

    const scoreA = await evaluateTarget(dirA);
    const scoreB = await evaluateTarget(dirB);
    const scoreC = await evaluateTarget(dirC);
    const armD = await runArmD();

    return {
      generatedAt: new Date().toISOString(),
      method: 'synthetic fixtures (no live agent); single run, no variance estimate',
      armA: scoreA,
      armB: scoreB,
      armC: scoreC,
      armD
    };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

/**
 * Arm D: raw scaffolded project, no agent additions. Scores what ships
 * deterministically (stage 1) and what bootstrap adds (stage 2, backend +
 * typescript; skipped when bash is unavailable).
 */
export async function runArmD() {
  const workRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-bench-armd-'));
  try {
    let scaffoldFn = null;
    try {
      const mod = await import('../lib/scaffold.js');
      scaffoldFn = mod.scaffold;
    } catch {
      return { status: 'unavailable', reason: 'compiled scaffold engine (lib/) unreadable' };
    }
    const target = path.join(workRoot, 'raw-scaffold');
    scaffoldFn({ targetDir: target, noGit: true });
    const raw = await auditScaffoldEnforcement(target);

    let bootstrapped = { status: 'skipped', reason: 'bash unavailable' };
    const script = path.join(path.resolve(selfDir, '..'), '.agents', 'skills', 'lets-build', 'scripts', 'bootstrap_workspace.sh');
    const bashBin = findBash();
    if (bashBin) {
      const r = spawnSync(bashBin, [script, target, 'backend', 'typescript'], { encoding: 'utf-8', timeout: 30000 });
      bootstrapped = r.status === 0
        ? await auditScaffoldEnforcement(target)
        : { status: 'failed', reason: `bootstrap exited ${r.status}` };
    }
    return { status: 'assessed', raw, bootstrapped };
  } finally {
    fs.rmSync(workRoot, { recursive: true, force: true });
  }
}

function printAudit(label, audit) {
  if (!audit || !Array.isArray(audit.deterministic)) {
    console.log(`  ${label}: ${audit?.status || 'unknown'}${audit?.reason ? ` (${audit.reason})` : ''}`);
    return;
  }
  console.log(`  ${label}: ${audit.ok ? 'ENFORCED' : 'GAPS'}`);
  for (const c of [...audit.deterministic, ...audit.agent]) {
    console.log(`    [${c.ok ? 'ok' : 'GAP'}] ${c.name}: ${c.detail}`);
  }
}

function writeTranscript(results) {
  const outDir = path.join(selfDir, 'results');
  try {
    fs.mkdirSync(outDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outFile = path.join(outDir, `benchmark-${stamp}.json`);
    fs.writeFileSync(outFile, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`\n📝 Raw transcript written to: ${path.relative(process.cwd(), outFile)}`);
  } catch (err) {
    console.log(`\n⚠️ Could not write transcript: ${err.message}`);
  }
}

function printArmScore(label, arm) {
  console.log(`${label}:`);
  console.log(`  Oversized Files (>300 lines):   ${arm.oversizedFileCount}`);
  console.log(`  Dependency Cycles:             ${arm.dependencyCyclesCount}`);
  console.log(`  Boundary Violations:           ${arm.boundaryViolationsCount}`);
  console.log(`  Drift Free:                    ${arm.passed ? 'YES' : 'NO'}\n`);
}

function printArmD(armD) {
  console.log('ARM D (Raw Scaffold - No Agent Additions):');
  if (armD.status === 'assessed') {
    printAudit('stage 1 (scaffold only)', armD.raw);
    printAudit('stage 2 (+ bootstrap backend+typescript)', armD.bootstrapped);
  } else {
    console.log(`  ${armD.status}${armD.reason ? ` (${armD.reason})` : ''}`);
  }
  console.log('');
}

export async function main() {
  console.log('🚀 Running Drift-Reduction Benchmark Across 3 Arms...\n');
  const results = await runFullBenchmark();

  printArmScore('ARM A (Control - Plain Starter)', results.armA);
  printArmScore('ARM B (Hooks Only - agent_guard.js)', results.armB);
  printArmScore('ARM C (Treatment - Full Azcodr Architecture)', results.armC);
  printArmD(results.armD);

  console.log('LIMITATIONS (read before citing):');
  console.log('  - Synthetic fixtures, not live agent runs; single run, no variance.');
  console.log('  - Token cost, wall-clock, completion rate, and human review minutes NOT measured.');
  console.log('  - Where Azcodr loses on paper: added lint/hook friction and scaffold ceremony;');
  console.log('    on real runs expect higher per-ticket tokens vs control. Measure it, do not assume it.');
  console.log('  - To rerun against a real agent: execute benchmark/tickets/tickets.json in order,');
  console.log('    then score each arm with: node benchmark/evaluate.js <dir>');

  writeTranscript(results);
}

if (process.argv[1] && process.argv[1].endsWith('run-benchmark.js')) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
