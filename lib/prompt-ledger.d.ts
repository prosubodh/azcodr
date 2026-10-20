/**
 * Mechanical Prompt Ledger parser and integrity validator.
 *
 * Enforces the Zero-Unattended-Prompt Invariant by mechanically inspecting
 * workspace prompt ledgers (.agents/ledger/pending.md) before execution
 * milestones or git commits are permitted.
 */
export interface PromptDirective {
    text: string;
    completed: boolean;
}
export interface PromptLedgerStatus {
    exists: boolean;
    clean: boolean;
    pendingCount: number;
    completedCount: number;
    pendingDirectives: PromptDirective[];
    completedDirectives: PromptDirective[];
}
export declare function parsePromptLedger(markdownContent: string): PromptLedgerStatus;
export declare function resolveLedgerPath(targetDirOrFile: string): string;
export declare function checkPromptLedger(targetDirOrFile: string): PromptLedgerStatus;
export interface PromptCommitInspection {
    blocked: boolean;
    reason?: string;
}
export declare function inspectPromptCommit(command: string, workspaceRoot?: string): PromptCommitInspection;
//# sourceMappingURL=prompt-ledger.d.ts.map