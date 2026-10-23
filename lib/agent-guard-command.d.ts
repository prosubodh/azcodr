/**
 * Command safety guard inspecting shell commands against a destructive denylist.
 */
/**
 * Represents the result of evaluating a shell command against the safety denylist.
 */
export interface CommandViolation {
    /** Whether the command is prohibited by the safety denylist. */
    blocked: boolean;
    /** Explanatory rationale if the command is blocked. */
    reason?: string;
    /** Normalized command string evaluated. */
    command?: string;
}
/**
 * Denylist pattern definition matching prohibited shell commands.
 */
export interface DenylistRule {
    /** Regular expression pattern detecting prohibited command syntax. */
    pattern: RegExp;
    /** Human-readable explanation of why the command is unsafe. */
    reason: string;
}
export declare const DESTRUCTIVE_RULES: readonly DenylistRule[];
export declare const DEFAULT_PROTECTED_BRANCHES: readonly string[];
export interface InspectCommandOptions {
    protectedBranches?: readonly string[];
    currentBranch?: string;
}
export declare function isBranchProtected(branch: string, patterns: readonly string[]): boolean;
export declare function extractPushTargetBranches(command: string): string[];
/**
 * Collapses multi-line strings and extra whitespace into a single normalized shell command string.
 *
 * @param raw - Raw command string.
 * @returns Cleaned single-line command string.
 */
export declare function normalizeCommand(raw: string): string;
/**
 * Checks a command string against the safety denylist.
 *
 * @param command - Raw shell command string.
 * @param options - Optional inspection options (e.g. protectedBranches, currentBranch).
 * @returns Violation details if blocked, or clean outcome.
 */
export declare function inspectCommand(command: string, options?: InspectCommandOptions): CommandViolation;
declare const _default: {
    DESTRUCTIVE_RULES: readonly DenylistRule[];
    DEFAULT_PROTECTED_BRANCHES: readonly string[];
    normalizeCommand: typeof normalizeCommand;
    isBranchProtected: typeof isBranchProtected;
    extractPushTargetBranches: typeof extractPushTargetBranches;
    inspectCommand: typeof inspectCommand;
};
export default _default;
//# sourceMappingURL=agent-guard-command.d.ts.map