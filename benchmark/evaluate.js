#!/usr/bin/env node

/**
 * Automated evaluation harness for the Drift-Reduction Benchmark.
 * Measures:
 *  1. Files over 300 lines (hygiene / Refactor-Before-Add)
 *  2. Dependency cycles (circular imports)
 *  3. Layer boundary violations (domain importing infra / controllers)
 *  4. Test quality proxy: assertions per test file (guards against
 *     assertion-free tests written only to satisfy line gates)
 *  5. Overall scorecard
 *
 * Cost metrics (tokens, wall-clock, human review minutes) are NOT measured
 * by this simulation — see RESULTS.md "Threats to validity". They must be
 * recorded manually when tickets are executed against a real agent harness.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const selfDir = path.dirname(fileURLToPath(import.meta.url));
const boundariesPath = path.resolve(selfDir, '../lib/boundaries.js');

async function getBoundariesModule() {
  if (fs.existsSync(boundariesPath)) {
    return import(pathToFileURL(boundariesPath).href);
  }
  return import(pathToFileURL(path.resolve(selfDir, '../src/boundaries.ts')).href);
}

function countLinesInFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8').split('\n').length;
  } catch {
    return 0;
  }
}

function scanOversizedFiles(files, absTarget) {
  const oversized = [];
  let maxLines = 0;
  for (const file of files) {
    const lines = countLinesInFile(file);
    if (lines > maxLines) maxLines = lines;
    if (lines > 300) {
      oversized.push({ file: path.relative(absTarget, file), lines });
    }
  }
  return { oversized, maxLines };
}

function mapBoundaryViolations(violations, absTarget) {
  return violations.map((v) => ({
    file: path.relative(absTarget, v.file),
    imported: path.relative(absTarget, v.importedFile),
    from: v.fromLayer,
    to: v.toLayer
  }));
}

function findTestFiles(dir, out = []) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findTestFiles(full, out);
    else if (/\.test\.(ts|js)$/.test(entry.name) || /\.spec\.(ts|js)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function countAssertionsInContent(content) {
  const matches = content.match(/(?:expect\s*\(|assert\.[a-zA-Z]+|assert\s*\()/g);
  return matches ? matches.length : 0;
}

export function measureTestQuality(targetDir) {
  const absTarget = path.resolve(targetDir);
  const testFiles = findTestFiles(absTarget);
  let assertionCount = 0;
  for (const file of testFiles) {
    try {
      assertionCount += countAssertionsInContent(fs.readFileSync(file, 'utf-8'));
    } catch {
      // unreadable test file counts as zero assertions
    }
  }
  const assertionsPerTestFile = testFiles.length > 0 ? assertionCount / testFiles.length : 0;
  return { testFileCount: testFiles.length, assertionCount, assertionsPerTestFile };
}

export async function evaluateTarget(targetDir = process.cwd()) {
  const absTarget = path.resolve(targetDir);
  const { findSourceFiles, buildDependencyGraph, detectDependencyCycles, detectBoundaryViolations } =
    await getBoundariesModule();

  const files = findSourceFiles(absTarget);
  const graph = buildDependencyGraph(files);
  const cycles = detectDependencyCycles(graph);
  const boundaryViolations = detectBoundaryViolations(graph);
  const { oversized, maxLines } = scanOversizedFiles(files, absTarget);
  const testQuality = measureTestQuality(absTarget);

  return {
    targetDir: absTarget,
    moduleCount: files.length,
    oversizedFileCount: oversized.length,
    oversizedFiles: oversized,
    maxFileLines: maxLines,
    dependencyCyclesCount: cycles.length,
    dependencyCycles: cycles.map((c) => c.map((p) => path.relative(absTarget, p))),
    boundaryViolationsCount: boundaryViolations.length,
    boundaryViolations: mapBoundaryViolations(boundaryViolations, absTarget),
    testFileCount: testQuality.testFileCount,
    assertionCount: testQuality.assertionCount,
    assertionsPerTestFile: Math.round(testQuality.assertionsPerTestFile * 100) / 100,
    costMetrics: {
      note: 'NOT measured by simulation; record tokens, wall-clock, and human review minutes manually on real agent runs.'
    },
    passed: oversized.length === 0 && cycles.length === 0 && boundaryViolations.length === 0
  };
}

function printScorecard(score) {
  console.log('\n📊 Azcodr Benchmark Evaluation Scorecard');
  console.log('==============================================================');
  console.log(`Directory:            ${score.targetDir}`);
  console.log(`Scanned Modules:      ${score.moduleCount}`);
  console.log(`Max File Lines:       ${score.maxFileLines}`);
  console.log(`Files > 300 lines:    ${score.oversizedFileCount}`);
  console.log(`Dependency Cycles:    ${score.dependencyCyclesCount}`);
  console.log(`Boundary Violations:  ${score.boundaryViolationsCount}`);
  console.log(`Test Files:           ${score.testFileCount} (${score.assertionCount} assertions, ${score.assertionsPerTestFile}/file)`);
  console.log(`Cost Metrics:         ${score.costMetrics.note}`);
  console.log('--------------------------------------------------------------');
  if (score.passed) {
    console.log('🎉 DRIFT SCORE: 0 Violations (Clean Architecture Maintained)\n');
  } else {
    console.log('🚨 DRIFT DETECTED: Architectural drift detected in codebase\n');
  }
}

export async function main() {
  const target = process.argv[2] || process.cwd();
  const score = await evaluateTarget(target);
  printScorecard(score);
  process.exit(score.passed ? 0 : 1);
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
