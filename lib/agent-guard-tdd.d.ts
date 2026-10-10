/**
 * Persistent state tracking test-first TDD progress across an agent session.
 */
export interface SessionTddState {
    /** Whether a failing test execution (RED phase) has been recorded in the session. */
    lastFailingTestRecorded: boolean;
    /** Unix timestamp in milliseconds when the last test execution occurred. */
    lastTestRunTime?: number;
    /** File path of the most recently executed test file. */
    lastTestPath?: string;
}
/**
 * Result of evaluating a file edit against RED-before-GREEN TDD rules.
 */
export interface TddCheckResult {
    /** Whether the file edit is blocked due to missing failing test. */
    blocked: boolean;
    /** Explanatory reason if the operation is blocked. */
    reason?: string;
    /** Whether the target file was identified as production source code. */
    isProductionFile: boolean;
}
/**
 * Identifies whether a given path is a unit or integration test file.
 *
 * @param filePath - File path to inspect.
 * @returns True if path matches test directory or file extension patterns.
 */
export declare function isTestFile(filePath: string): boolean;
/**
 * Identifies whether a given path is a non-code file (markdown, json, yaml, images).
 *
 * @param filePath - File path to inspect.
 * @returns True if file extension indicates non-code asset or configuration.
 */
export declare function isNonCodeFile(filePath: string): boolean;
/**
 * Identifies whether a given file path corresponds to production code under src/, lib/, or app/.
 *
 * @param filePath - File path to inspect.
 * @returns True if path is production source code subject to RED-before-GREEN discipline.
 */
export declare function isProductionFile(filePath: string): boolean;
/**
 * Loads session TDD tracking state from disk, defaulting to unrecorded state if missing.
 *
 * @param stateFile - Path to the persistent session state JSON file.
 * @returns Parsed SessionTddState object.
 */
export declare function readTddState(stateFile: string): SessionTddState;
/**
 * Persists session TDD state to disk with fail-safe error handling to avoid disrupting execution.
 *
 * @param stateFile - Path to the persistent session state JSON file.
 * @param state - SessionTddState object to record.
 */
export declare function writeTddState(stateFile: string, state: SessionTddState): void;
/**
 * Checks whether an edit to a file is allowed under RED-before-GREEN TDD rules.
 *
 * @param filePath - Path to file being edited.
 * @param state - Current session TDD state.
 * @param enforceTestFirst - Whether test-first enforcement is strictly enabled.
 * @returns Decision result indicating whether edit is blocked.
 */
export declare function inspectTddRequirement(filePath: string, state: SessionTddState, enforceTestFirst?: boolean): TddCheckResult;
declare const _default: {
    isTestFile: typeof isTestFile;
    isNonCodeFile: typeof isNonCodeFile;
    isProductionFile: typeof isProductionFile;
    readTddState: typeof readTddState;
    writeTddState: typeof writeTddState;
    inspectTddRequirement: typeof inspectTddRequirement;
};
export default _default;
//# sourceMappingURL=agent-guard-tdd.d.ts.map