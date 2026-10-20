import path from 'node:path';
import { checkPromptLedger } from './prompt-ledger.js';
export function handlePromptCommand(parsed, io) {
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
//# sourceMappingURL=cli-prompt.js.map