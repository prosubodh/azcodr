import fs from 'node:fs';
import path from 'node:path';
import { matchGlob } from './harness-resolve.js';

/**
 * Parameters provided to evaluate a proposed file write or edit operation.
 */
export interface FileCheckInput {
  /** Path of the file being written or edited. */
  filePath: string;
  /** Proposed full file content when creating or overwriting a file. */
  incomingContent?: string;
  /** Chunk replacement string when applying an in-place edit. */
  replacementContent?: string;
  /** Target content chunk being matched and replaced. */
  targetContent?: string;
  /** Configured line budget; omit to disable the check entirely. */
  maxLines?: number;
  /** Globs exempted from the budget, for generated or vendored files. */
  excludePaths?: readonly string[];
}

/**
 * Outcome of evaluating a proposed file modification against file size fitness functions.
 */
export interface FileCheckResult {
  /** Whether the file edit is blocked. */
  blocked: boolean;
  /** Explanation of the verdict, present whenever the budget is active. */
  reason?: string;
  /** Current line count of the file on disk. */
  currentLines: number;
  /** Projected line count after applying the proposed modification. */
  projectedLines: number;
  /** Active line budget, or null when the check is not configured. */
  maxLines: number | null;
}

/**
 * Counts lines, treating a trailing newline as a terminator rather than an
 * extra line, so a file whose last line is exactly at the limit still fits.
 *
 * @param text - Input string to evaluate.
 * @returns Total count of lines.
 */
export function countLines(text: string): number {
  if (!text) return 0;
  const normalized = text.endsWith('\n') ? text.slice(0, -1) : text;
  return normalized.split('\n').length;
}

/**
 * Reads an existing file from disk and returns its current line count.
 *
 * @param filePath - Path of file to inspect.
 * @returns Total number of lines, or 0 if unreadable or non-existent.
 */
export function readExistingLines(filePath: string): number {
  if (!fs.existsSync(filePath)) return 0;
  try {
    return countLines(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return 0;
  }
}

function calculateProjectedLines(currentLines: number, input: FileCheckInput): number {
  if (input.incomingContent !== undefined) {
    return countLines(input.incomingContent);
  }
  if (input.replacementContent !== undefined) {
    const added = countLines(input.replacementContent);
    const removed = input.targetContent !== undefined ? countLines(input.targetContent) : 1;
    return Math.max(0, currentLines + added - removed);
  }
  return currentLines;
}

function excluded(filePath: string, patterns: readonly string[]): boolean {
  const rel = filePath.replace(/\\/g, '/');
  return patterns.some((pattern) => matchGlob(rel, pattern));
}

function checkBudgetViolation(
  name: string,
  lines: { current: number; projected: number },
  maxLines: number
): { blocked: boolean; reason?: string } {
  const { current, projected } = lines;
  if (current > maxLines) {
    if (projected >= current) {
      return {
        blocked: true,
        reason:
          `Line budget: '${name}' currently has ${current} lines (limit: ${maxLines}). ` +
          'Non-shrinking edits to an over-budget file are blocked. Reduce it, or raise the ' +
          "project's configured budget, before adding more."
      };
    }
    return { blocked: false };
  }

  if (projected > maxLines) {
    return {
      blocked: true,
      reason:
        `Line budget: '${name}' would grow to ${projected} lines (limit: ${maxLines}). ` +
        'Split it into focused units, or raise the configured budget.'
    };
  }

  return { blocked: false };
}

function evaluate(params: {
  filePath: string;
  currentLines: number;
  projectedLines: number;
  maxLines: number | null;
  excludePaths: readonly string[];
}): FileCheckResult {
  const { filePath, currentLines, projectedLines, maxLines, excludePaths } = params;
  const base = { currentLines, projectedLines, maxLines };

  if (maxLines === null) {
    return { ...base, blocked: false, reason: 'No line budget is configured for this project.' };
  }
  if (excludePaths.length > 0 && excluded(filePath, excludePaths)) {
    return {
      ...base,
      blocked: false,
      reason: `'${path.basename(filePath)}' is excluded from the line budget by configuration.`
    };
  }

  const outcome = checkBudgetViolation(
    path.basename(filePath),
    { current: currentLines, projected: projectedLines },
    maxLines
  );
  return { ...base, ...outcome };
}

/**
 * Checks a proposed file write or edit against the configured line budget.
 *
 * With no `maxLines` the check is inert: a file of any size is permitted. This
 * is deliberate — a line budget is a project decision, not a universal law.
 *
 * @param input - File path, proposed content and configured budget.
 * @returns Decision result indicating whether the write is blocked.
 */
export function inspectFileWrite(input: FileCheckInput): FileCheckResult {
  return evaluate({
    filePath: input.filePath,
    currentLines: readExistingLines(input.filePath),
    projectedLines: calculateProjectedLines(readExistingLines(input.filePath), input),
    maxLines: input.maxLines ?? null,
    excludePaths: input.excludePaths ?? []
  });
}

export default { countLines, readExistingLines, inspectFileWrite };
