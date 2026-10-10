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
 * @returns Violation details if blocked, or clean outcome.
 */
export declare function inspectCommand(command: string): CommandViolation;
declare const _default: {
    DESTRUCTIVE_RULES: readonly DenylistRule[];
    normalizeCommand: typeof normalizeCommand;
    inspectCommand: typeof inspectCommand;
};
export default _default;
//# sourceMappingURL=agent-guard-command.d.ts.map