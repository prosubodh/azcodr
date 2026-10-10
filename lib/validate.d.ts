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