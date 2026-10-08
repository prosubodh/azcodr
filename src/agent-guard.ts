import path from 'node:path';
import { inspectCommand } from './agent-guard-command.js';
import type { CommandViolation } from './agent-guard-command.js';
import { inspectFileWrite } from './agent-guard-file.js';
import type { FileCheckResult } from './agent-guard-file.js';
import {
  inspectTddRequirement,
  readTddState,
  writeTddState
} from './agent-guard-tdd.js';
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

function parseEnvelope(raw: string): ToolEnvelope | null {
  try {
    const trimmed = raw.trim();
    if (!trimmed.startsWith('{')) return null;
    return JSON.parse(trimmed) as ToolEnvelope;
  } catch {
    return null;
  }
}

function extractKey(input: Record<string, unknown>, keys: readonly string[]): string | undefined {
  for (const k of keys) {
    if (typeof input[k] === 'string') return input[k];
  }
  return undefined;
}

function extractFilePath(input: Record<string, unknown>): string | undefined {
  return extractKey(input, ['TargetFile', 'file_path', 'path', 'filePath']);
}

function extractCommand(input: Record<string, unknown>): string | undefined {
  return extractKey(input, ['CommandLine', 'command', 'cmd']);
}

function inspectPreCommand(cmd: string): GuardDecision {
  const violation = inspectCommand(cmd);
  if (violation.blocked) {
    return { allowed: false, reason: violation.reason, source: 'command' };
  }
  return { allowed: true };
}

function inspectPreFile(
  filePath: string,
  input: Record<string, unknown>,
  options: GuardOptions
): GuardDecision {
  const incoming = extractKey(input, ['CodeContent', 'content']);
  const replacement = extractKey(input, ['ReplacementContent', 'replacement']);
  const target = extractKey(input, ['TargetContent', 'target']);

  const fileDecision = inspectFileWrite({
    filePath,
    incomingContent: incoming,
    replacementContent: replacement,
    targetContent: target,
    maxLines: options.maxFileLines
  });
  if (fileDecision.blocked) {
    return { allowed: false, reason: fileDecision.reason, source: 'file' };
  }

  const root = options.workspaceRoot ?? process.cwd();
  const statePath = path.join(root, '.agents', '.session-state.json');
  const state = readTddState(statePath);
  const tddDecision = inspectTddRequirement(filePath, state, options.enforceTestFirst);
  if (tddDecision.blocked) {
    return { allowed: false, reason: tddDecision.reason, source: 'tdd' };
  }

  return { allowed: true };
}

/**
 * Inspects a tool-use request before execution (PreToolUse hook).
 *
 * @param rawInput - Raw command string, JSON envelope, or argv slice.
 * @param options - Guard configuration options.
 * @returns Guard decision indicating whether tool execution is permitted.
 */
export function inspectPreTool(rawInput: string, options: GuardOptions = {}): GuardDecision {
  const env = parseEnvelope(rawInput);

  if (env && env.tool_input) {
    const cmd = extractCommand(env.tool_input);
    if (cmd) return inspectPreCommand(cmd);

    const targetFile = extractFilePath(env.tool_input);
    if (targetFile) return inspectPreFile(targetFile, env.tool_input, options);
  }

  return inspectPreCommand(rawInput);
}

export {
  inspectCommand,
  inspectFileWrite,
  inspectTddRequirement,
  readTddState,
  writeTddState
};
export type { CommandViolation, FileCheckResult, SessionTddState };
export default { inspectPreTool, inspectCommand, inspectFileWrite, inspectTddRequirement };
