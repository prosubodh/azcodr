import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * Tally and results returned by the architecture governance validator.
 */
export interface ValidationResult {
  /** Total count of fatal governance errors encountered. */
  errors: number;
  /** Total count of non-fatal governance warnings encountered. */
  warnings: number;
  /** Number of progressive disclosure domain rule files verified. */
  validatedRules: number;
  /** Number of agent skills verified under .agents/skills/. */
  validatedSkills: number;
  /** Total count of internal markdown links verified. */
  totalLinks: number;
  /** List of broken link targets detected across workspace markdown files. */
  brokenLinks: string[];
}

/**
 * Pluggable reporter interface receiving live validation events.
 */
export interface ValidationReporter {
  /** Called when a check passes. */
  pass: (msg: string) => void;
  /** Called when a non-fatal warning is raised. */
  warn: (msg: string) => void;
  /** Called when a validation check fails. */
  fail: (msg: string) => void;
  /** Called for informative messages and section spacing. */
  log: (msg: string) => void;
  /** Called when a new validation phase begins. */
  heading: (msg: string) => void;
}

/**
 * Validates the agentic architecture and governance files of a workspace.
 *
 * @param workspaceRoot - Path to the workspace directory (defaults to cwd).
 * @param reporter - Optional custom reporter hooks.
 * @returns Object containing error and warning tallies and validation counts.
 */
export async function validate(
  workspaceRoot: string = process.cwd(),
  reporter?: ValidationReporter
): Promise<ValidationResult> {
  const baseDir = import.meta.dirname ?? path.dirname(fileURLToPath(import.meta.url));
  const scriptPath = path.resolve(baseDir, '../scripts/validate.js');
  const mod = await import(pathToFileURL(scriptPath).href);
  return mod.runValidation(path.resolve(workspaceRoot), reporter);
}

const noop = (): void => {};

/**
 * Creates a silent reporter that suppresses all status reports.
 */
export function createSilentReporter(): ValidationReporter {
  return { pass: noop, warn: noop, fail: noop, log: noop, heading: noop };
}

export default { validate, createSilentReporter };
