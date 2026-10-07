import cp from 'node:child_process';
import { ScaffoldError, ERROR_CODES } from './errors.js';
/**
 * Socket-hardened process boundary (Supply Chain: shell access).
 * Scaffolder must spawn `git`, but never via a shell string.
 * Uses execFileSync with argv (shell:false) and an explicit subcommand allowlist.
 * No network, no env exfiltration; cwd is constrained to targetDir callers.
 */
export const GIT_ALLOWED_SUBCOMMANDS = new Set([
    'rev-parse',
    'init',
    'branch',
    'add',
    'commit'
]);
export function runGit(args, options = {}) {
    if (!Array.isArray(args) || args.length === 0) {
        throw new ScaffoldError('E_GIT_ARGS_INVALID', ERROR_CODES.E_GIT_ARGS_INVALID);
    }
    const subcommand = args[0];
    if (!subcommand || !GIT_ALLOWED_SUBCOMMANDS.has(subcommand)) {
        throw new ScaffoldError('E_GIT_BLOCKED', `${ERROR_CODES.E_GIT_BLOCKED}: ${String(subcommand)}`);
    }
    return cp.execFileSync('git', args, {
        encoding: 'utf-8',
        stdio: 'pipe',
        shell: false,
        ...options
    });
}
export default { GIT_ALLOWED_SUBCOMMANDS, runGit };
//# sourceMappingURL=git.js.map