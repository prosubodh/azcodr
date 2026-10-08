import path from 'node:path';
import fs from 'node:fs';
import { inspectBoundaries } from './boundaries.js';
import type { BoundaryReport } from './boundaries.js';
import type { CliParsedOptions } from './cli-parse.js';

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

function printViolations(report: BoundaryReport, out: (msg: string) => void): void {
  const total = report.cycles.length + report.violations.length;
  out(`🚨 ARCHITECTURAL VIOLATIONS DETECTED (${total}):`);
  for (const cycle of report.cycles) {
    out(`   - Circular Dependency: ${cycle.join(' -> ')}`);
  }
  for (const v of report.violations) {
    out(`   - Layer Boundary Breach: ${v.file} illegally imports ${v.importedFile} (${v.fromLayer} -> ${v.toLayer})`);
  }
  out('   Action Required: Invert dependencies via Ports or extract shared modules.\n');
}

export function formatBoundaryReport(
  targetDir: string,
  report: BoundaryReport,
  out: (msg: string) => void
): void {
  out(`\n🔍 Inspecting Architectural Boundaries in: ${targetDir}`);
  out('--------------------------------------------------------------');
  if (report.ok) {
    out(`✅ Analyzed ${report.moduleCount} modules: 0 circular cycles, 0 boundary violations.`);
    out('🎉 SUCCESS: Architecture is clean and drift-free! (0 violations)\n');
  } else {
    printViolations(report, out);
  }
}

export async function handleBoundariesCommand(
  parsed: CliParsedOptions,
  io: BoundaryIo
): Promise<void | number> {
  const targetDir = resolveBoundaryTarget(parsed.targetDir, io.cwd);
  const report = inspectBoundaries(targetDir);

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
