import type { FailFn, PassFn, SkipFn } from './types.js';
/** Ledger structure recovered from a memory file. */
export interface ParsedLedger {
    /** ADR numbers found as well-formed `#### ADR-NNN` headings. */
    entryIds: number[];
    /** ADR numbers referenced by the master index table. */
    indexIds: number[];
    /** ADR numbers that appear with a malformed heading depth. */
    malformed: number[];
    /** ADR numbers with more than one entry heading. */
    duplicateIds: number[];
}
/** Result of cross-checking the index against the entries. */
export type LedgerConsistency = 'indexed' | 'clean-slate' | 'inconsistent';
/**
 * Extracts ADR entry ids, index rows, and heading defects from a ledger.
 *
 * @param memoryText - Raw contents of the decision ledger.
 * @returns The recovered ledger structure.
 */
export declare function parseAdrLedger(memoryText: string): ParsedLedger;
/**
 * Cross-checks the master index against the ledger entries.
 *
 * Fails when an ADR exists but is absent from the index, or when the index
 * advertises an ADR with no entry.
 *
 * @param workspaceRoot - Workspace containing memory.md.
 * @param fail - Failure reporter.
 * @param pass - Pass reporter.
 * @returns Whether the ledger is indexed, empty, or inconsistent.
 */
export declare function checkAdrIndexConsistency(workspaceRoot: string, fail: FailFn, pass: PassFn): LedgerConsistency;
/** Verdicts the glossary check may report. */
export interface GlossaryVerdicts {
    fail: FailFn;
    warn: (msg: string) => void;
    pass: PassFn;
    skip?: SkipFn;
}
/**
 * The glossary is required once ADRs exist to prevent drift.
 *
 * @param workspaceRoot - Workspace to inspect.
 * @param verdicts - Reporter callbacks.
 */
export declare function checkGlossaryPopulated(workspaceRoot: string, verdicts: GlossaryVerdicts): void;
//# sourceMappingURL=adr.d.ts.map