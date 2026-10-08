import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_MAX_FILE_LINES = 300;

export interface FileCheckInput {
  filePath: string;
  incomingContent?: string;
  replacementContent?: string;
  targetContent?: string;
  maxLines?: number;
}

export interface FileCheckResult {
  blocked: boolean;
  reason?: string;
  currentLines: number;
  projectedLines: number;
  maxLines: number;
}

export function countLines(text: string): number {
  if (!text) return 0;
  return text.split('\n').length;
}

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
