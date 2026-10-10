import fs from 'node:fs';
import path from 'node:path';

/**
 * Default maximum lines allowed per file before triggering Refactor-Before-Add enforcement.
 */
export const DEFAULT_MAX_FILE_LINES = 300;

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
  /** Optional custom maximum line threshold (defaults to DEFAULT_MAX_FILE_LINES). */
  maxLines?: number;
}

/**
 * Outcome of evaluating a proposed file modification against file size fitness functions.
 */
export interface FileCheckResult {
  /** Whether the file edit is blocked under Refactor-Before-Add. */
  blocked: boolean;
  /** Human-readable explanation when the write is blocked. */
  reason?: string;
  /** Current line count of the file on disk. */
  currentLines: number;
  /** Projected line count after applying the proposed modification. */
  projectedLines: number;
  /** Maximum line limit enforced for this file. */
  maxLines: number;
}

/**
 * Calculates the number of newline-delimited lines in a given text string.
 *
 * @param text - Input string to evaluate.
 * @returns Total count of lines.
 */
export function countLines(text: string): number {
  if (!text) return 0;
  return text.split('\n').length;
}

/**
 * Reads an existing file from disk and returns its current line count.
 *
 * @param filePath - Path of the file to inspect.
 * @returns Total number of lines, or 0 if unreadable or non-existent.
 */
export function readExistingLines(filePath: string): number {
  if (!fs.existsSync(filePath)) return 0;
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return countLines(content);
  } catch {
    return 0;
  }
}

function calculateProjectedLines(currentLines: number, input: FileCheckInput): number {
  if (input.incomingContent !== undefined) {
    return countLines(input.incomingContent);
  }
  if (input.replacementContent !== undefined) {
    const addedLines = countLines(input.replacementContent);
    const removedLines = input.targetContent !== undefined ? countLines(input.targetContent) : 1;
    return Math.max(0, currentLines + addedLines - removedLines);
  }
  return currentLines;
}

interface ThresholdParams {
  filePath: string;
  currentLines: number;
  projectedLines: number;
  maxLines: number;
}

function evaluateLineThresholds(params: ThresholdParams): FileCheckResult {
  const { filePath, currentLines, projectedLines, maxLines } = params;
  const base = { currentLines, projectedLines, maxLines };
  const relPath = path.basename(filePath);

  if (currentLines > maxLines) {
    if (projectedLines >= currentLines) {
      return {
        ...base,
        blocked: true,
        reason: `Refactor-Before-Add violation: '${relPath}' currently has ${currentLines} lines (limit: ${maxLines}). Adding or maintaining lines in an overflowing file is blocked. Refactor into modular units under green tests first.`
      };
    }
    return { ...base, blocked: false };
  }

  if (projectedLines > maxLines) {
    return {
      ...base,
      blocked: true,
      reason: `File line budget exceeded: '${relPath}' would grow to ${projectedLines} lines (limit: ${maxLines}). Decompose into modular components before appending more code.`
    };
  }

  return { ...base, blocked: false };
}

/**
 * Checks a proposed file write or edit against Refactor-Before-Add rules.
 *
 * @param input - File path and proposed content.
 * @returns Decision result indicating whether the write is blocked.
 */
export function inspectFileWrite(input: FileCheckInput): FileCheckResult {
  const maxLines = input.maxLines ?? DEFAULT_MAX_FILE_LINES;
  const currentLines = readExistingLines(input.filePath);
  const projectedLines = calculateProjectedLines(currentLines, input);

  return evaluateLineThresholds({
    filePath: input.filePath,
    currentLines,
    projectedLines,
    maxLines
  });
}

export default {
  DEFAULT_MAX_FILE_LINES,
  countLines,
  readExistingLines,
  inspectFileWrite
};
