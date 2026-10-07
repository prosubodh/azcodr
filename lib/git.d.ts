import cp from 'node:child_process';
/**
 * Socket-hardened process boundary (Supply Chain: shell access).
 * Scaffolder must spawn `git`, but never via a shell string.
 * Uses execFileSync with argv (shell:false) and an explicit subcommand allowlist.
 * No network, no env exfiltration; cwd is constrained to targetDir callers.
 */
export declare const GIT_ALLOWED_SUBCOMMANDS: Set<string>;
export declare function runGit(args: string[], options?: cp.ExecFileSyncOptions): string;
declare const _default: {
    GIT_ALLOWED_SUBCOMMANDS: Set<string>;
    runGit: typeof runGit;
};
export default _default;
//# sourceMappingURL=git.d.ts.map