export interface SessionTddState {
    lastFailingTestRecorded: boolean;
    lastTestRunTime?: number;
    lastTestPath?: string;
}
export interface TddCheckResult {
    blocked: boolean;
    reason?: string;
    isProductionFile: boolean;
}
export declare function isTestFile(filePath: string): boolean;
export declare function isNonCodeFile(filePath: string): boolean;
export declare function isProductionFile(filePath: string): boolean;
export declare function readTddState(stateFile: string): SessionTddState;
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