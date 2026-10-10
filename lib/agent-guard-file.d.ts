/**
 * Default maximum lines allowed per file before triggering Refactor-Before-Add enforcement.
 */
export declare const DEFAULT_MAX_FILE_LINES = 300;
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
export declare function countLines(text: string): number;
/**
 * Reads an existing file from disk and returns its current line count.
 *
 * @param filePath - Path of the file to inspect.
 * @returns Total number of lines, or 0 if unreadable or non-existent.
 */
export declare function readExistingLines(filePath: string): number;
/**
 * Checks a proposed file write or edit against Refactor-Before-Add rules.
 *
 * @param input - File path and proposed content.
 * @returns Decision result indicating whether the write is blocked.
 */
export declare function inspectFileWrite(input: FileCheckInput): FileCheckResult;
declare const _default: {
    DEFAULT_MAX_FILE_LINES: number;
    countLines: typeof countLines;
    readExistingLines: typeof readExistingLines;
    inspectFileWrite: typeof inspectFileWrite;
};
export default _default;
//# sourceMappingURL=agent-guard-file.d.ts.map