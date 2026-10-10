import { inspectCommand } from './agent-guard-command.js';
import type { CommandViolation } from './agent-guard-command.js';
import { inspectFileWrite } from './agent-guard-file.js';
import type { FileCheckResult } from './agent-guard-file.js';
import { inspectTddRequirement, readTddState, writeTddState } from './agent-guard-tdd.js';
import type { SessionTddState } from './agent-guard-tdd.js';
/**
 * Verdict returned by agent-runtime safety and architecture inspection guards.
 */
export interface GuardDecision {
    /** Whether the requested tool operation is permitted. */
    allowed: boolean;
    /** Explanatory failure reason when the action is blocked. */
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
 * Configuration options governing agent guard enforcement behavior.
 */
export interface GuardOptions {
    /** Target workspace root directory (defaults to process.cwd()). */
    workspaceRoot?: string;
    /** When true, strictly mandates RED failing test before modifying production code. */
    enforceTestFirst?: boolean;
    /** Maximum non-overflow file line threshold before Refactor-Before-Add triggers. */
    maxFileLines?: number;
}
/**
 * Inspects a tool-use request before execution (PreToolUse hook).
 *
 * @param rawInput - Raw command string, JSON envelope, or argv slice.
 * @param options - Guard configuration options.
 * @returns Guard decision indicating whether tool execution is permitted.
 */
export declare function inspectPreTool(rawInput: string, options?: GuardOptions): GuardDecision;
export { inspectCommand, inspectFileWrite, inspectTddRequirement, readTddState, writeTddState };
export type { CommandViolation, FileCheckResult, SessionTddState };
declare const _default: {
    inspectPreTool: typeof inspectPreTool;
    inspectCommand: typeof inspectCommand;
    inspectFileWrite: typeof inspectFileWrite;
    inspectTddRequirement: typeof inspectTddRequirement;
};
export default _default;
//# sourceMappingURL=agent-guard.d.ts.map