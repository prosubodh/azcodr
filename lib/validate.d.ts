export interface ValidationResult {
    errors: number;
    warnings: number;
    validatedRules: number;
    validatedSkills: number;
    totalLinks: number;
    brokenLinks: string[];
}
export interface ValidationReporter {
    pass: (msg: string) => void;
    warn: (msg: string) => void;
    fail: (msg: string) => void;
    log: (msg: string) => void;
    heading: (msg: string) => void;
}
/**
 * Validates the agentic architecture and governance files of a workspace.
 *
 * @param workspaceRoot - Path to the workspace directory (defaults to cwd).
 * @param reporter - Optional custom reporter hooks.
 * @returns Object containing error and warning tallies and validation counts.
 */
export declare function validate(workspaceRoot?: string, reporter?: ValidationReporter): Promise<ValidationResult>;
/**
 * Creates a silent reporter that suppresses all status reports.
 */
export declare function createSilentReporter(): ValidationReporter;
declare const _default: {
    validate: typeof validate;
    createSilentReporter: typeof createSilentReporter;
};
export default _default;
//# sourceMappingURL=validate.d.ts.map