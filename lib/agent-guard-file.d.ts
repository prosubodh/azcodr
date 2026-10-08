export declare const DEFAULT_MAX_FILE_LINES = 300;
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
export declare function countLines(text: string): number;
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