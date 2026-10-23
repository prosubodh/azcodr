import fs from 'node:fs';
import path from 'node:path';

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

const CHECKBOX_REGEX = /^\s*-\s*\[([ xX])\]\s*(.+)$/gm;

export function parsePromptLedger(markdownContent: string): PromptLedgerStatus {
  const pendingDirectives: PromptDirective[] = [];
  const completedDirectives: PromptDirective[] = [];

  for (const match of markdownContent.matchAll(CHECKBOX_REGEX)) {
    const mark = match[1]!;
    const text = match[2]!.trim();
    const isCompleted = mark.toLowerCase() === 'x';
    const item: PromptDirective = { text, completed: isCompleted };
    if (isCompleted) {
      completedDirectives.push(item);
    } else {
      pendingDirectives.push(item);
    }
  }

  return {
    exists: true,
    clean: pendingDirectives.length === 0,
    pendingCount: pendingDirectives.length,
    completedCount: completedDirectives.length,
    pendingDirectives,
    completedDirectives
  };
}

export function resolveLedgerPath(targetDirOrFile: string): string {
  try {
    const stat = fs.statSync(targetDirOrFile);
    if (stat.isDirectory()) {
      return path.join(targetDirOrFile, '.agents', 'ledger', 'pending.md');
    }
    return targetDirOrFile;
  } catch {
    return targetDirOrFile;
  }
}

export function checkPromptLedger(targetDirOrFile: string): PromptLedgerStatus {
  const filePath = resolveLedgerPath(targetDirOrFile);
  if (!fs.existsSync(filePath)) {
    return {
      exists: false,
      clean: true,
      pendingCount: 0,
      completedCount: 0,
      pendingDirectives: [],
      completedDirectives: []
    };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  return parsePromptLedger(content);
}

export interface PromptCommitInspection {
  blocked: boolean;
  reason?: string;
}

const GIT_COMMIT_REGEX = /\bgit\s+commit\b/i;

export function inspectPromptCommit(
  command: string,
  workspaceRoot: string = process.cwd()
): PromptCommitInspection {
  if (!GIT_COMMIT_REGEX.test(command)) {
    return { blocked: false };
  }

  const status = checkPromptLedger(workspaceRoot);
  if (!status.exists || status.clean) {
    return { blocked: false };
  }

  const itemsList = status.pendingDirectives.map((d) => `  - ${d.text}`).join('\n');
  const reason =
    `BLOCKED by Zero-Unattended-Prompt Invariant: Cannot commit while ${status.pendingCount} prompt directive(s) remain pending in .agents/ledger/pending.md:\n` +
    itemsList;

  return {
    blocked: true,
    reason
  };
}

export interface PromptPruneResult {
  deleted: boolean;
  reason?: string;
  filePath?: string;
}

export function pruneCompletedLedger(
  targetDirOrFile: string = process.cwd()
): PromptPruneResult {
  const filePath = resolveLedgerPath(targetDirOrFile);
  if (!fs.existsSync(filePath)) {
    return {
      deleted: false,
      reason: 'No prompt ledger found at target location.'
    };
  }

  const status = checkPromptLedger(targetDirOrFile);
  if (!status.clean) {
    return {
      deleted: false,
      reason: `Cannot delete ledger: ${status.pendingCount} directive(s) are still pending. Complete all items before deleting.`
    };
  }

  try {
    fs.unlinkSync(filePath);
    return {
      deleted: true,
      filePath
    };
  } catch (err: unknown) {
    return {
      deleted: false,
      reason: `Failed to delete ledger file: ${err instanceof Error ? err.message : String(err)}`
    };
  }
}

