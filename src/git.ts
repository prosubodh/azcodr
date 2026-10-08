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

/**
 * Safely executes an allowlisted git subcommand using execFileSync with an argument array and shell disabled.
 *
 * @param args - Subcommand and arguments array to pass to git.
 * @param options - Child process execution options.
 * @returns Standard output from git as a string.
 * @throws {ScaffoldError} When args is empty or the subcommand is not in GIT_ALLOWED_SUBCOMMANDS.
 */
export function runGit(args: string[], options: cp.ExecFileSyncOptions = {}): string {
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
  }) as string;
}

export default { GIT_ALLOWED_SUBCOMMANDS, runGit };
