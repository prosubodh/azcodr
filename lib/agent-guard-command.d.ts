/**
 * Command safety guard inspecting shell commands against a destructive denylist.
 */
export interface CommandViolation {
    blocked: boolean;
    reason?: string;
    command?: string;
}
export interface DenylistRule {
    pattern: RegExp;
    reason: string;
}
export declare const DESTRUCTIVE_RULES: readonly DenylistRule[];
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