import path from 'node:path';
import fs from 'node:fs';
import { inspectBoundaries, findSourceFiles } from './boundaries.js';
import type { BoundaryReport, BoundaryRule } from './boundaries.js';
import { loadHarnessConfig } from './harness-config.js';
import { resolveChecks } from './harness-resolve.js';
import type { CliParsedOptions } from './cli-parse.js';

export { findSourceFiles };

export interface BoundaryIo {
  out: (msg: string) => void;
  err: (msg: string) => void;
  exit: (code: number) => void | number;
  cwd: string;
}

export function resolveBoundaryTarget(targetDir: string | null, cwd: string): string {
  if (targetDir) {
    return path.resolve(cwd, targetDir);
  }
  const defaultSrc = path.join(cwd, 'src');
  return fs.existsSync(defaultSrc) ? defaultSrc : cwd;
}

/**
 * Converts declared layer rules into boundary-engine rules.
 *
 * Layer rules live in the project's configuration, so a run with no config
 * performs cycle detection only and never invents a layer vocabulary.
 */
export function declaredLayerRules(root: string): BoundaryRule[] {
  const config = loadHarnessConfig(root);
  const report = resolveChecks(config, config.project);
  const layers = report.get('layer-boundaries')!.layers;
  return Object.entries(layers).map(([fromLayer, disallowed]) => ({
    fromLayer,
    disallowImportsFrom: disallowed
  }));
}

function printEmpty(out: (msg: string) => void): void {
  out('⚠️  No analysable source files were found in the target.');
  out('   This is NOT a clean result: nothing was checked. Point --target at a');
  out('   source directory, or declare source extensions in harness.yaml.\n');
}

function printViolations(report: BoundaryReport, out: (msg: string) => void): void {
  const total = report.cycles.length + report.violations.length;
  out(`🚨 ARCHITECTURAL VIOLATIONS DETECTED (${total}):`);
  for (const cycle of report.cycles) {
    out(`   - Circular Dependency: ${cycle.join(' -> ')}`);
  }
  for (const v of report.violations) {
    out(`   - Layer Boundary Breach: ${v.file} illegally imports ${v.importedFile} (${v.fromLayer} -> ${v.toLayer})`);
  }
  out('   Remedy: extract the shared piece behind an interface, or declare an');
  out('   exemption in harness.yaml if this dependency is intentional.\n');
}

export function formatBoundaryReport(
  targetDir: string,
  report: BoundaryReport,
  out: (msg: string) => void
): void {
  out(`\n🔍 Inspecting Architectural Boundaries in: ${targetDir}`);
  out('--------------------------------------------------------------');
  if (report.moduleCount === 0) {
    printEmpty(out);
  } else if (report.ok) {
    out(`✅ Analyzed ${report.moduleCount} modules: 0 circular cycles, 0 boundary violations.`);
  } else {
    printViolations(report, out);
  }
}

export async function handleBoundariesCommand(
  parsed: CliParsedOptions,
  io: BoundaryIo
): Promise<void | number> {
  const targetDir = resolveBoundaryTarget(parsed.targetDir, io.cwd);
  const root = fs.existsSync(path.join(targetDir, 'harness.yaml'))
    ? targetDir
    : path.dirname(targetDir);
  const rules = declaredLayerRules(root);
  const report = inspectBoundaries(targetDir, rules);

  if (!parsed.silent) {
    formatBoundaryReport(targetDir, report, io.out);
  }

  return io.exit(report.ok ? 0 : 1);
}

export default {
  resolveBoundaryTarget,
  formatBoundaryReport,
  handleBoundariesCommand
};
