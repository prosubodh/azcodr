import { inspectCommand } from './agent-guard-command.js';
import type { CommandViolation } from './agent-guard-command.js';
import { inspectFileWrite } from './agent-guard-file.js';
import type { FileCheckResult } from './agent-guard-file.js';
import { inspectTddRequirement, readTddState, writeTddState } from './agent-guard-tdd.js';
import type { SessionTddState, TddEnforcement, TddCheckResult, PathMatcher } from './agent-guard-tdd.js';
/**
 * Verdict returned by agent-runtime inspection guards.
 */
export interface GuardDecision {
    /** Whether the requested tool operation is permitted. */
    allowed: boolean;
    /** Explanatory reason when the action is blocked. */
    reason?: string;
    /** Subsystem that produced the decision ('command', 'file', or 'tdd'). */
    source?: 'command' | 'file' | 'tdd';
}
/**
 * Normalized representation of an agent tool invocation payload.
 */
export interface ToolEnvelope {
    /** Name of the tool invoked by the agent. */
    tool_name?: string;
    /** Parameter payload passed to the tool invocation. */
    tool_input?: Record<string, unknown>;
}
/**
 * Project-declared enforcement settings. Every field is optional: an absent
 * configuration enables no optional rule.
 */
export interface GuardOptions {
    /** Target workspace root directory. */
    workspaceRoot?: string;
    /** Line budget; omit to disable the file-size check. */
    maxFileLines?: number;
    /** Globs exempted from the line budget. */
    excludeFilePaths?: readonly string[];
    /** RED-before-GREEN enforcement settings. */
    tdd?: TddEnforcement;
    /** Disables every file-based rule while keeping command safety active. */
    skipFileRules?: boolean;
    /** Protected branches prohibited from direct push. */
    protectedBranches?: readonly string[];
}
export declare function inspectPreTool(rawInput: string, options?: GuardOptions): GuardDecision;
export { inspectCommand, inspectFileWrite, inspectTddRequirement, readTddState, writeTddState };
export type { CommandViolation, FileCheckResult, SessionTddState, PathMatcher, TddEnforcement, TddCheckResult };
declare const _default: {
    inspectPreTool: typeof inspectPreTool;
    inspectCommand: typeof inspectCommand;
    inspectFileWrite: typeof inspectFileWrite;
    inspectTddRequirement: typeof inspectTddRequirement;
};
export default _default;
//# sourceMappingURL=agent-guard.d.ts.map