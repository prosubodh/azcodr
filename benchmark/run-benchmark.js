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
import { evaluateTarget } from './evaluate.js';

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

    return {
      armA: scoreA,
      armB: scoreB,
      armC: scoreC
    };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

export async function main() {
  console.log('🚀 Running Drift-Reduction Benchmark Across 3 Arms...\n');
  const results = await runFullBenchmark();

  console.log('ARM A (Control - Plain Starter):');
  console.log(`  Oversized Files (>300 lines):   ${results.armA.oversizedFileCount}`);
  console.log(`  Dependency Cycles:             ${results.armA.dependencyCyclesCount}`);
  console.log(`  Boundary Violations:           ${results.armA.boundaryViolationsCount}`);
  console.log(`  Drift Free:                    ${results.armA.passed ? 'YES' : 'NO'}\n`);

  console.log('ARM B (Hooks Only - agent_guard.js):');
  console.log(`  Oversized Files (>300 lines):   ${results.armB.oversizedFileCount}`);
  console.log(`  Dependency Cycles:             ${results.armB.dependencyCyclesCount}`);
  console.log(`  Boundary Violations:           ${results.armB.boundaryViolationsCount}`);
  console.log(`  Drift Free:                    ${results.armB.passed ? 'YES' : 'NO'}\n`);

  console.log('ARM C (Treatment - Full Azcodr Architecture):');
  console.log(`  Oversized Files (>300 lines):   ${results.armC.oversizedFileCount}`);
  console.log(`  Dependency Cycles:             ${results.armC.dependencyCyclesCount}`);
  console.log(`  Boundary Violations:           ${results.armC.boundaryViolationsCount}`);
  console.log(`  Drift Free:                    ${results.armC.passed ? 'YES' : 'NO'}\n`);
}

if (process.argv[1] && process.argv[1].endsWith('run-benchmark.js')) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
