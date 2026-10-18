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
export declare function validate(workspaceRoot?: string, reporter?: Reporter): Promise<ValidationResult>;
export { createSilentReporter };
export type { Reporter, Reporter as ValidationReporter, ValidationResult };
declare const _default: {
    validate: typeof validate;
    createSilentReporter: typeof createSilentReporter;
};
export default _default;
//# sourceMappingURL=validate.d.ts.map