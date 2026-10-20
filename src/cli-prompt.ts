import path from 'node:path';
import { checkPromptLedger } from './prompt-ledger.js';
import type { CliParsedOptions } from './cli-parse.js';

export interface PromptIo {
  out: (msg: string) => void;
  err: (msg: string) => void;
  exit: (code: number) => void | number;
  cwd: string;
}

export function handlePromptCommand(
  parsed: CliParsedOptions,
  io: PromptIo
): void | number {
  const targetRoot = parsed.targetDir
    ? path.resolve(io.cwd, parsed.targetDir)
    : io.cwd;

  const status = checkPromptLedger(targetRoot);

  if (!status.exists) {
    if (!parsed.silent) {
      io.out('No prompt ledger found at .agents/ledger/pending.md (workspace clean).');
    }
    return io.exit(0);
  }

  if (status.clean) {
    if (!parsed.silent) {
      io.out(`✅ Prompt Ledger Clean: 0 pending directives (${status.completedCount} completed).`);
    }
    return io.exit(0);
  }

  io.err(`🚨 PROMPT DIRECTIVES PENDING (${status.pendingCount}):`);
  for (const item of status.pendingDirectives) {
    io.err(`   - [ ] ${item.text}`);
  }
  io.err('   Remedy: resolve all prompt directives and mark them [x] in .agents/ledger/pending.md before committing.\n');
  return io.exit(1);
}

export default { handlePromptCommand };
