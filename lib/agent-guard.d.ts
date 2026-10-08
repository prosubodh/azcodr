import { inspectCommand } from './agent-guard-command.js';
import type { CommandViolation } from './agent-guard-command.js';
import { inspectFileWrite } from './agent-guard-file.js';
import type { FileCheckResult } from './agent-guard-file.js';
import { inspectTddRequirement, readTddState, writeTddState } from './agent-guard-tdd.js';
import type { SessionTddState } from './agent-guard-tdd.js';
export interface GuardDecision {
    allowed: boolean;
    reason?: string;
    source?: 'command' | 'file' | 'tdd';
}
export interface ToolEnvelope {
    tool_name?: string;
    tool_input?: Record<string, unknown>;
}
export interface GuardOptions {
    workspaceRoot?: string;
    enforceTestFirst?: boolean;
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