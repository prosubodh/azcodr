export interface InitGitOptions {
    noGit?: boolean;
    dryRun?: boolean;
}
/**
 * Detects whether targetDir is already inside an existing Git worktree.
 * Socket note: shell access is limited to `git rev-parse` via runGit (no shell).
 */
export declare function isInsideGitWorkTree(targetDir: string): boolean;
/**
 * Initializes a git repository in the target directory if not already inside one.
 * Socket note: only allowlisted `git init/branch/add/commit` via execFileSync, cwd scoped.
 */
export declare function initGit(targetDir: string, options?: InitGitOptions): boolean;
declare const _default: {
    isInsideGitWorkTree: typeof isInsideGitWorkTree;
    initGit: typeof initGit;
};
export default _default;
//# sourceMappingURL=repo.d.ts.map