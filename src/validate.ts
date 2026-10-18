import path from 'node:path';
import { runValidation } from './validator/run.js';
import { createSilentReporter } from './validator/io.js';
import type { Reporter, ValidationResult } from './validator/types.js';

/**
 * Validates a workspace and resolves with the tally.
 *
 * Kept async because the CLI awaits it; the underlying work is synchronous.
 *
 * @param workspaceRoot - Path to the workspace directory.
 * @param reporter - Optional reporter; defaults to a console reporter.
 * @returns Error and warning tallies plus per-phase counts.
 */
export async function validate(
  workspaceRoot: string = process.cwd(),
  reporter?: Reporter
): Promise<ValidationResult> {
  return runValidation(path.resolve(workspaceRoot), reporter);
}

export { createSilentReporter };
export type { Reporter, Reporter as ValidationReporter, ValidationResult };
export default { validate, createSilentReporter };
