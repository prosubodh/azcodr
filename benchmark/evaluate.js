#!/usr/bin/env node

/**
 * Automated evaluation harness for the Drift-Reduction Benchmark.
 * Measures:
 *  1. Files over 300 lines (hygiene / Refactor-Before-Add)
 *  2. Dependency cycles (circular imports)
 *  3. Layer boundary violations (domain importing infra / controllers)
 *  4. Overall scorecard
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

export async function evaluateTarget(targetDir = process.cwd()) {
  const absTarget = path.resolve(targetDir);
  const { findSourceFiles, buildDependencyGraph, detectDependencyCycles, detectBoundaryViolations } =
    await getBoundariesModule();

  const files = findSourceFiles(absTarget);
  const graph = buildDependencyGraph(files);
  const cycles = detectDependencyCycles(graph);
  const boundaryViolations = detectBoundaryViolations(graph);
  const { oversized, maxLines } = scanOversizedFiles(files, absTarget);

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
