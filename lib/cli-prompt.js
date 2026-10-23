import path from 'node:path';
import { checkPromptLedger, pruneCompletedLedger } from './prompt-ledger.js';
export function handlePromptCommand(parsed, io) {
    const targetRoot = parsed.targetDir
        ? path.resolve(io.cwd, parsed.targetDir)
        : io.cwd;
    if (parsed.prune) {
        const result = pruneCompletedLedger(targetRoot);
        if (!result.deleted) {
            io.err(`🚨 ${result.reason || 'Failed to prune prompt ledger.'}`);
            return io.exit(1);
        }
        if (!parsed.silent) {
            io.out('✅ Completed prompt ledger successfully deleted.');
        }
        return io.exit(0);
    }
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
//# sourceMappingURL=cli-prompt.js.map