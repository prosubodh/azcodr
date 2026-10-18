/**
 * Persistent state tracking test-first progress across an agent session.
 */
export interface SessionTddState {
    /** Whether a failing test execution (RED phase) has been recorded. */
    lastFailingTestRecorded: boolean;
    /** Unix timestamp in milliseconds when the last test execution occurred. */
    lastTestRunTime?: number;
    /** File path of the most recently executed test file. */
    lastTestPath?: string;
}
/**
 * Project-declared path classifications that decide what counts as
 * production code. With no `productionPaths` declared, nothing is production.
 */
export interface PathMatcher {
    /** Globs identifying production source. */
    productionPaths: readonly string[];
    /** Globs identifying test artefacts, including BDD step definitions. */
    testPaths: readonly string[];
    /** Extensions treated as data or configuration rather than code. */
    nonCodeExtensions: readonly string[];
}
/**
 * Result of evaluating a file edit against RED-before-GREEN rules.
 */
export interface TddCheckResult {
    /** Whether the file edit is blocked due to a missing failing test. */
    blocked: boolean;
    /** Explanatory reason, present whenever the rule is active. */
    reason?: string;
    /** Whether the target file was identified as production source code. */
    isProductionFile: boolean;
}
/**
 * Identifies whether a path is a test artefact using built-in conventions.
 *
 * @param filePath - File path to inspect.
 * @returns True if the path matches a conventional test layout.
 */
export declare function isTestFile(filePath: string): boolean;
/**
 * Identifies whether a path is a non-code asset or configuration file.
 *
 * @param filePath - File path to inspect.
 * @returns True if the extension indicates non-code content.
 */
export declare function isNonCodeFile(filePath: string): boolean;
export declare function isProductionFile(filePath: string, rules: PathMatcher): boolean;
/**
 * Loads session test-first tracking state, defaulting to unrecorded.
 *
 * @param stateFile - Path to the persistent session state JSON file.
 * @returns Parsed SessionTddState object.
 */
export declare function readTddState(stateFile: string): SessionTddState;
/**
 * Persists session state, failing silently so a write error cannot interrupt work.
 *
 * @param stateFile - Path to the persistent session state JSON file.
 * @param state - State to record.
 */
export declare function writeTddState(stateFile: string, state: SessionTddState): void;
/**
 * Configuration governing RED-before-GREEN enforcement.
 */
export interface TddEnforcement {
    /** Whether the rule is active at all. */
    enforceTestFirst: boolean;
    /** Globs identifying production source. Empty means the rule cannot fire. */
    productionPaths?: readonly string[];
    /** Globs identifying test artefacts. */
    testPaths?: readonly string[];
    /** Extensions treated as non-code. */
    nonCodeExtensions?: readonly string[];
}
/**
 * Checks whether an edit is permitted under RED-before-GREEN rules.
 *
 * Fails open in every ambiguous case: an unconfigured project, or a rule with
 * no production paths declared, blocks nothing.
 *
 * @param filePath - Path of file being edited.
 * @param state - Current session state.
 * @param config - Project-declared enforcement settings.
 * @returns Decision result indicating whether the edit is blocked.
 */
export declare function inspectTddRequirement(filePath: string, state: SessionTddState, config: TddEnforcement): TddCheckResult;
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