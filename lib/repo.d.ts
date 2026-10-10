/**
 * Options controlling git repository initialization.
 */
export interface InitGitOptions {
    /** If true, skip git repository initialization entirely. */
    noGit?: boolean;
    /** If true, simulate git repository initialization without invoking git. */
    dryRun?: boolean;
}
/**
 * Detects whether targetDir is already inside an existing Git worktree.
 * Socket note: shell access is limited to `git rev-parse` via runGit (no shell).
 *
 * @param targetDir - Directory path to inspect.
 * @returns True if target directory is within a git worktree, false otherwise.
 */
export declare function isInsideGitWorkTree(targetDir: string): boolean;
/**
 * Initializes a git repository in the target directory if not already inside one.
 * Socket note: only allowlisted `git init/branch/add/commit` via execFileSync, cwd scoped.
 *
 * @param targetDir - Directory where git repository should be initialized.
 * @param options - Configuration options for git initialization.
 * @returns True if repository was initialized and committed, false otherwise.
 */
export declare function initGit(targetDir: string, options?: InitGitOptions): boolean;
declare const _default: {
    isInsideGitWorkTree: typeof isInsideGitWorkTree;
    initGit: typeof initGit;
};
export default _default;
//# sourceMappingURL=repo.d.ts.map