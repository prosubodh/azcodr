import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { runGit } from './git.js';

const INITIAL_COMMIT_MESSAGE = 'chore: initial scaffold from azcodr template';

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
export function isInsideGitWorkTree(targetDir: string): boolean {
  try {
    const checkDir = fs.existsSync(targetDir) ? targetDir : path.dirname(targetDir);
    const out = runGit(['rev-parse', '--is-inside-work-tree'], {
      cwd: checkDir,
      stdio: ['ignore', 'pipe', 'ignore']
    });
    return String(out).trim() === 'true';
  } catch {
    return false;
  }
}

function renameBranchMain(targetDir: string): void {
  try {
    runGit(['branch', '-m', 'main'], { cwd: targetDir, stdio: 'ignore' });
  } catch {
    // Non-critical if branch rename fails
  }
}

function initRepository(targetDir: string): void {
  try {
    runGit(['init', '-b', 'main', '-q'], { cwd: targetDir, stdio: 'ignore' });
  } catch {
    runGit(['init', '-q'], { cwd: targetDir, stdio: 'ignore' });
    renameBranchMain(targetDir);
  }
}

function commitWithFallbackIdentity(targetDir: string): void {
  const options = { cwd: targetDir, stdio: 'ignore' as const };
  try {
    runGit(['commit', '-q', '-m', INITIAL_COMMIT_MESSAGE], options);
  } catch {
    runGit(['commit', '-q', '-m', INITIAL_COMMIT_MESSAGE], {
      ...options,
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: 'azcodr[bot]',
        GIT_AUTHOR_EMAIL: 'bot@azcodr.internal',
        GIT_COMMITTER_NAME: 'azcodr[bot]',
        GIT_COMMITTER_EMAIL: 'bot@azcodr.internal'
      }
    });
  }
}

function initialCommit(targetDir: string): void {
  try {
    runGit(['add', '-A'], { cwd: targetDir, stdio: 'ignore' });
    commitWithFallbackIdentity(targetDir);
  } catch {
    // Non-critical if initial commit fails
  }
}

/**
 * Initializes a git repository in the target directory if not already inside one.
 * Socket note: only allowlisted `git init/branch/add/commit` via execFileSync, cwd scoped.
 *
 * @param targetDir - Directory where git repository should be initialized.
 * @param options - Configuration options for git initialization.
 * @returns True if repository was initialized and committed, false otherwise.
 */
export function initGit(targetDir: string, options: InitGitOptions = {}): boolean {
  const { noGit = false, dryRun = false } = options;
  if (noGit) return false;
  const gitDir = path.join(targetDir, '.git');
  if (fs.existsSync(gitDir)) return false;
  if (isInsideGitWorkTree(targetDir)) return false;
  if (dryRun) return true;
  try {
    initRepository(targetDir);
    initialCommit(targetDir);
    return true;
  } catch {
    return false;
  }
}

export default { isInsideGitWorkTree, initGit };
