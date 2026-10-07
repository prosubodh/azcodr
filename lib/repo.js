import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { runGit } from './git.js';
const INITIAL_COMMIT_MESSAGE = 'chore: initial scaffold from azcodr template';
/**
 * Detects whether targetDir is already inside an existing Git worktree.
 * Socket note: shell access is limited to `git rev-parse` via runGit (no shell).
 */
export function isInsideGitWorkTree(targetDir) {
    try {
        const checkDir = fs.existsSync(targetDir) ? targetDir : path.dirname(targetDir);
        const out = runGit(['rev-parse', '--is-inside-work-tree'], {
            cwd: checkDir,
            stdio: ['ignore', 'pipe', 'ignore']
        });
        return String(out).trim() === 'true';
    }
    catch {
        return false;
    }
}
function renameBranchMain(targetDir) {
    try {
        runGit(['branch', '-m', 'main'], { cwd: targetDir, stdio: 'ignore' });
    }
    catch {
        // Non-critical if branch rename fails
    }
}
function initRepository(targetDir) {
    try {
        runGit(['init', '-b', 'main', '-q'], { cwd: targetDir, stdio: 'ignore' });
    }
    catch {
        runGit(['init', '-q'], { cwd: targetDir, stdio: 'ignore' });
        renameBranchMain(targetDir);
    }
}
function commitWithFallbackIdentity(targetDir) {
    const options = { cwd: targetDir, stdio: 'ignore' };
    try {
        runGit(['commit', '-q', '-m', INITIAL_COMMIT_MESSAGE], options);
    }
    catch {
        runGit(['commit', '-q', '-m', INITIAL_COMMIT_MESSAGE], {
            ...options,
            env: {
                ...process.env,
                GIT_AUTHOR_NAME: 'Subodh Khanal',
                GIT_AUTHOR_EMAIL: 'prosubodh@gmail.com',
                GIT_COMMITTER_NAME: 'Subodh Khanal',
                GIT_COMMITTER_EMAIL: 'prosubodh@gmail.com'
            }
        });
    }
}
function initialCommit(targetDir) {
    try {
        runGit(['add', '-A'], { cwd: targetDir, stdio: 'ignore' });
        commitWithFallbackIdentity(targetDir);
    }
    catch {
        // Non-critical if initial commit fails
    }
}
/**
 * Initializes a git repository in the target directory if not already inside one.
 * Socket note: only allowlisted `git init/branch/add/commit` via execFileSync, cwd scoped.
 */
export function initGit(targetDir, options = {}) {
    const { noGit = false, dryRun = false } = options;
    if (noGit)
        return false;
    const gitDir = path.join(targetDir, '.git');
    if (fs.existsSync(gitDir))
        return false;
    if (isInsideGitWorkTree(targetDir))
        return false;
    if (dryRun)
        return true;
    try {
        initRepository(targetDir);
        initialCommit(targetDir);
        return true;
    }
    catch {
        return false;
    }
}
export default { isInsideGitWorkTree, initGit };
//# sourceMappingURL=repo.js.map