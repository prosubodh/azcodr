#!/usr/bin/env node

/**
 * Native Zero-Dependency Mutation Testing Harness.
 * Validates assertion depth by injecting synthetic mutants into core guards
 * and verifying that test suites fail (kill every mutant).
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const selfDir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(selfDir, '..');

export const MUTATION_TARGETS = [
  {
    name: 'Command Denylist Bypass',
    file: 'src/agent-guard-command.ts',
    testFile: 'tests/agent-guard.test.ts',
    target: 'blocked: true,',
    replacement: 'blocked: false,'
  },
  {
    name: 'File Size Threshold Relaxation',
    file: 'src/agent-guard-file.ts',
    testFile: 'tests/agent-guard.test.ts',
    target: 'export const DEFAULT_MAX_FILE_LINES = 300;',
    replacement: 'export const DEFAULT_MAX_FILE_LINES = 9999;'
  },
  {
    name: 'TDD RED-before-GREEN Guard Bypass',
    file: 'src/agent-guard-tdd.ts',
    testFile: 'tests/agent-guard.test.ts',
    target: 'blocked: true,',
    replacement: 'blocked: false,'
  },
  {
    name: 'Dependency Cycle Detector Inactivation',
    file: 'src/boundaries.ts',
    testFile: 'tests/boundaries.test.ts',
    target: 'return cycles;',
    replacement: 'return [];'
  },
  {
    name: 'Layer Boundary Enforcer Inactivation',
    file: 'src/boundaries.ts',
    testFile: 'tests/boundaries.test.ts',
    target: 'return violations;',
    replacement: 'return [];'
  },
  {
    name: 'Protected System Target Guard Inactivation',
    file: 'src/guards.ts',
    testFile: 'tests/protected-target.test.ts',
    target: 'if (isFilesystemRoot(resolvedTarget)) return true;',
    replacement: 'if (isFilesystemRoot(resolvedTarget)) return false;'
  },
  {
    name: 'Starter CI Write Omission',
    file: 'src/starter-ci.ts',
    testFile: 'tests/scaffold-ci.test.ts',
    target: "const actions = ['generate: .github/workflows/ci.yml (starter governance CI)'];",
    replacement: 'const actions: string[] = [];'
  },
  {
    name: 'Boundary Guard Fail-Closed Bypass',
    file: '.agents/scripts/boundary_guard.js',
    testFile: 'tests/boundary-guard.test.ts',
    target: 'process.exit(2);',
    replacement: 'process.exit(0);'
  }
];

function runTestForMutant(testFile) {
  const jestBin = path.join(ROOT, 'node_modules', 'jest', 'bin', 'jest.js');
  const res = spawnSync(
    process.execPath,
    ['--experimental-vm-modules', jestBin, testFile, '--silent'],
    {
      cwd: ROOT,
      encoding: 'utf-8',
      env: { ...process.env, NODE_OPTIONS: '--experimental-vm-modules' }
    }
  );
  return res.status !== 0;
}

export function testSingleMutant(mutant) {
  const filePath = path.join(ROOT, mutant.file);
  const originalSource = fs.readFileSync(filePath, 'utf-8');

  if (!originalSource.includes(mutant.target)) {
    throw new Error(`Target string not found in ${mutant.file}: "${mutant.target}"`);
  }

  const mutatedSource = originalSource.replace(mutant.target, mutant.replacement);
  fs.writeFileSync(filePath, mutatedSource, 'utf-8');

  try {
    const killed = runTestForMutant(mutant.testFile);
    return { name: mutant.name, file: mutant.file, killed };
  } finally {
    fs.writeFileSync(filePath, originalSource, 'utf-8');
  }
}

export function runAllMutations(targets = MUTATION_TARGETS) {
  const results = [];
  for (const mutant of targets) {
    const res = testSingleMutant(mutant);
    results.push(res);
  }
  const killedCount = results.filter((r) => r.killed).length;
  const score = Math.round((killedCount / results.length) * 100);
  return { results, total: results.length, killed: killedCount, score };
}

function printMutationReport(summary) {
  console.log('\n🧬 Azcodr Mutation Testing Report');
  console.log('==============================================================');
  for (const r of summary.results) {
    const icon = r.killed ? '💀 KILLED' : '🧟 SURVIVED';
    console.log(`  [${icon}] ${r.name} (${r.file})`);
  }
  console.log('--------------------------------------------------------------');
  console.log(`Total Mutants:   ${summary.total}`);
  console.log(`Killed Mutants:  ${summary.killed}`);
  console.log(`Mutation Score:  ${summary.score}%\n`);
}

export function main() {
  console.log('Injecting AST mutants into core architectural guards...');
  const summary = runAllMutations();
  printMutationReport(summary);

  if (summary.score < 100) {
    console.error('❌ Mutation score is below 100%. Surviving mutants detected!');
    process.exit(1);
  }
  console.log('🎉 100% Mutation Score! All mutants successfully killed by test suite.\n');
  process.exit(0);
}

if (process.argv[1] && process.argv[1].endsWith('mutation-test.js')) {
  main();
}
