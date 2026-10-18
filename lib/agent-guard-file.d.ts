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
export declare function countLines(text: string): number;
/**
 * Reads an existing file from disk and returns its current line count.
 *
 * @param filePath - Path of file to inspect.
 * @returns Total number of lines, or 0 if unreadable or non-existent.
 */
export declare function readExistingLines(filePath: string): number;
/**
 * Checks a proposed file write or edit against the configured line budget.
 *
 * With no `maxLines` the check is inert: a file of any size is permitted. This
 * is deliberate — a line budget is a project decision, not a universal law.
 *
 * @param input - File path, proposed content and configured budget.
 * @returns Decision result indicating whether the write is blocked.
 */
export declare function inspectFileWrite(input: FileCheckInput): FileCheckResult;
declare const _default: {
    countLines: typeof countLines;
    readExistingLines: typeof readExistingLines;
    inspectFileWrite: typeof inspectFileWrite;
};
export default _default;
//# sourceMappingURL=agent-guard-file.d.ts.map