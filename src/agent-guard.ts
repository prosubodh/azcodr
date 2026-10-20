import path from 'node:path';
import { inspectCommand } from './agent-guard-command.js';
import type { CommandViolation } from './agent-guard-command.js';
import { inspectFileWrite } from './agent-guard-file.js';
import type { FileCheckResult } from './agent-guard-file.js';
import { inspectTddRequirement, readTddState, writeTddState } from './agent-guard-tdd.js';
import type { SessionTddState, TddEnforcement, TddCheckResult, PathMatcher } from './agent-guard-tdd.js';
import { inspectPromptCommit } from './prompt-ledger.js';

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
}

function parseEnvelope(raw: string): ToolEnvelope | null {
  try {
    const trimmed = raw.trim();
    if (!trimmed.startsWith('{')) return null;
    return JSON.parse(trimmed) as ToolEnvelope;
  } catch {
    return null;
  }
}

/**
 * Reads a string value under any of the supplied keys, comparing key names
 * case- and separator-insensitively. Agent harnesses are inconsistent about
 * casing (`target_file` vs `TargetFile` vs `targetFile`), so an exact-match
 * list silently misses real payloads.
 */
function extractKey(input: Record<string, unknown>, keys: readonly string[]): string | undefined {
  const normalize = (value: string): string => value.replace(/[_\-\s]/g, '').toLowerCase();
  const wanted = new Set(keys.map(normalize));
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string' && wanted.has(normalize(key))) return value;
  }
  return undefined;
}

function extractFilePath(input: Record<string, unknown>): string | undefined {
  return extractKey(input, ['targetFile', 'filePath', 'path', 'file']);
}

function extractCommand(input: Record<string, unknown>): string | undefined {
  return extractKey(input, ['commandLine', 'command', 'cmd']);
}

function inspectPreCommand(cmd: string, workspaceRoot?: string): GuardDecision {
  const violation = inspectCommand(cmd);
  if (violation.blocked) return { allowed: false, reason: violation.reason, source: 'command' };
  const promptViolation = inspectPromptCommit(cmd, workspaceRoot);
  if (promptViolation.blocked) return { allowed: false, reason: promptViolation.reason, source: 'command' };
  return { allowed: true };
}

function inspectPreFile(
  filePath: string,
  input: Record<string, unknown>,
  options: GuardOptions
): GuardDecision {
  if (options.skipFileRules) return { allowed: true };

  const fileDecision = inspectFileWrite({
    filePath,
    incomingContent: extractKey(input, ['fileContent', 'content', 'file_text', 'text', 'CodeContent']),
    replacementContent: extractKey(input, ['replacementContent', 'replacement', 'new_string', 'new_str']),
    targetContent: extractKey(input, ['targetContent', 'target', 'old_string', 'old_str']),
    maxLines: options.maxFileLines,
    excludePaths: options.excludeFilePaths
  });
  if (fileDecision.blocked) {
    return { allowed: false, reason: fileDecision.reason, source: 'file' };
  }

  const root = options.workspaceRoot ?? process.cwd();
  const state = readTddState(path.join(root, '.agents', '.session-state.json'));
  const tddDecision = inspectTddRequirement(filePath, state, options.tdd ?? { enforceTestFirst: false });
  if (tddDecision.blocked) return { allowed: false, reason: tddDecision.reason, source: 'tdd' };

  return { allowed: true };
}

/**
 * Inspects a tool-use request before execution.
 *
 * Command safety is always active. File-size and test-first rules run only to
 * the extent the project has declared them in `harness.yaml`.
 *
 * @param rawInput - Raw command string, JSON envelope, or argv slice.
 * @param options - Project-declared enforcement settings.
 * @returns Guard decision indicating whether tool execution is permitted.
 */
function findFirstObject(sources: unknown[], keys: readonly string[]): Record<string, unknown> | null {
  for (const src of sources) {
    if (!src || typeof src !== 'object') continue;
    const rec = src as Record<string, unknown>;
    for (const key of keys) {
      const val = rec[key];
      if (val && typeof val === 'object') return val as Record<string, unknown>;
    }
  }
  return null;
}

function extractPayload(raw: Record<string, unknown>): Record<string, unknown> {
  const nested = findFirstObject([raw], ['toolCall', 'tool_call']);
  const fromNested = findFirstObject([nested], ['args', 'parameters', 'arguments']);
  if (fromNested) return fromNested;
  const direct = findFirstObject([raw], ['tool_input', 'input', 'parameters', 'arguments', 'args']);
  return direct ?? raw;
}

export function inspectPreTool(rawInput: string, options: GuardOptions = {}): GuardDecision {
  const env = parseEnvelope(rawInput);
  if (env && typeof env === 'object') {
    const record = extractPayload(env as Record<string, unknown>);
    const cmd = extractCommand(record);
    if (cmd) return inspectPreCommand(cmd, options.workspaceRoot);

    const targetFile = extractFilePath(record);
    if (targetFile) return inspectPreFile(targetFile, record, options);
    return { allowed: true };
  }

  return inspectPreCommand(rawInput, options.workspaceRoot);
}

export { inspectCommand, inspectFileWrite, inspectTddRequirement, readTddState, writeTddState };
export type { CommandViolation, FileCheckResult, SessionTddState, PathMatcher, TddEnforcement, TddCheckResult };
export default { inspectPreTool, inspectCommand, inspectFileWrite, inspectTddRequirement };
