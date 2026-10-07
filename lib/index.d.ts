/**
 * Enterprise Multi-Tenant Architecture & Agentic Engineering Starter Template
 * Programmatic API Definitions
 */

export interface ScaffoldOptions {
  /** Target directory path where template should be scaffolded (default: process.cwd()) */
  targetDir?: string;
  /** Force overwrite if target directory is non-empty (default: false) */
  force?: boolean;
  /** Skip git repository initialization (default: false) */
  noGit?: boolean;
  /** Custom template root directory (default: azcodr root) */
  templateDir?: string;
  /** Simulate scaffolding without writing files or running git (default: false) */
  dryRun?: boolean;
  /** Suppress console output messages (default: false) */
  silent?: boolean;
}

export interface ScaffoldResult {
  /** Whether the scaffolding succeeded */
  success: boolean;
  /** Absolute resolved path of the target directory */
  targetDir: string;
  /** Whether git init was successfully executed */
  gitInitialized: boolean;
  /** Whether execution ran in dry-run simulation mode */
  dryRun: boolean;
  /** List of files, directories, and symlinks created or simulated */
  actions: string[];
}

export interface ValidateTargetOptions {
  /** Custom template root directory */
  templateDir?: string;
  /** Force allow non-empty directory */
  force?: boolean;
}

export interface InitGitOptions {
  /** If true, skips git initialization */
  noGit?: boolean;
  /** If true, simulates git initialization without executing */
  dryRun?: boolean;
}

export interface CopyTemplateOptions {
  /** If true, simulates copy without writing to disk */
  dryRun?: boolean;
}

/**
 * Machine-readable failure codes thrown by this library.
 *
 * Branch on `error.code`, never on `error.message`: message wording may change
 * between releases, codes are part of the public contract.
 */
export type ScaffoldErrorCode =
  | 'E_TARGET_IS_TEMPLATE'
  | 'E_TARGET_NOT_EMPTY'
  | 'E_GIT_ARGS_INVALID'
  | 'E_GIT_BLOCKED'
  | 'E_PATH_ESCAPE';

/** Error type thrown by every azcodr API. Always carries a `code`. */
export interface ScaffoldErrorShape extends Error {
  name: 'ScaffoldError';
  code: ScaffoldErrorCode;
}

export declare class ScaffoldError extends Error implements ScaffoldErrorShape {
  constructor(code: ScaffoldErrorCode, message: string);
  name: 'ScaffoldError';
  code: ScaffoldErrorCode;
}

/** Human-readable prefix for each code, as thrown. */
export declare const ERROR_CODES: Readonly<Record<ScaffoldErrorCode, string>>;

/**
 * High-level orchestration function to scaffold the azcodr workspace into targetDir.
 */
export function scaffold(options?: ScaffoldOptions): ScaffoldResult;

/**
 * Validates the target directory to ensure it is suitable for scaffolding.
 */
export function validateTarget(targetDir: string, options?: ValidateTargetOptions): void;

/**
 * Copies template items into target directory and sets up symlinks and permissions.
 */
export function copyTemplate(
  targetDir: string,
  templateDir?: string,
  options?: CopyTemplateOptions
): string[];

/**
 * Safely creates or updates a symbolic link, falling back to a file copy if symlinks are unsupported.
 */
export function ensureSymlink(
  targetDir: string,
  linkName: string,
  targetFileName: string,
  dryRun?: boolean
): boolean;

/**
 * Creates a symlink, falling back to a text pointer (not a full copy).
 */
export function ensureSymlinkOrPointer(
  targetDir: string,
  linkName: string,
  targetFileName: string,
  dryRun?: boolean
): boolean;

/**
 * Detects whether linkName and targetFileName refer to the same entry on a case-insensitive filesystem.
 */
export function isSameCaseInsensitiveFile(
  targetDir: string,
  linkName: string,
  targetFileName: string
): boolean;

/**
 * Ensures all bash scripts in skill directories have executable permissions (0o755).
 */
export function makeScriptsExecutable(targetDir: string, dryRun?: boolean): string[];

/**
 * Initializes a git repository in the target directory if not already inside one.
 */
export function initGit(targetDir: string, options?: InitGitOptions): boolean;

/**
 * Detects whether targetDir is already inside an existing Git worktree.
 * Shell access is limited to `git rev-parse` via a shell-free allowlisted spawn.
 */
export function isInsideGitWorkTree(targetDir: string): boolean;

/**
 * Spawns `git` with argv (never a shell string) through an explicit
 * subcommand allowlist. @throws ScaffoldError with E_GIT_ARGS_INVALID or E_GIT_BLOCKED.
 */
export function runGit(args: string[], options?: Record<string, unknown>): string;

/**
 * Scope guard: throws if `candidate` resolves outside `root`.
 * @throws ScaffoldError with E_PATH_ESCAPE.
 */
export function assertInside(root: string, candidate: string, message?: string): void;

/**
 * Returns the root path to the azcodr template files.
 */
export function getTemplateDir(): string;

/**
 * Array of essential template files and directories copied during scaffolding.
 */
export const TEMPLATE_ITEMS: readonly string[];

declare const defaultExport: {
  scaffold: typeof scaffold;
  validateTarget: typeof validateTarget;
  copyTemplate: typeof copyTemplate;
  ensureSymlink: typeof ensureSymlink;
  ensureSymlinkOrPointer: typeof ensureSymlinkOrPointer;
  isSameCaseInsensitiveFile: typeof isSameCaseInsensitiveFile;
  makeScriptsExecutable: typeof makeScriptsExecutable;
  initGit: typeof initGit;
  isInsideGitWorkTree: typeof isInsideGitWorkTree;
  runGit: typeof runGit;
  assertInside: typeof assertInside;
  getTemplateDir: typeof getTemplateDir;
  TEMPLATE_ITEMS: typeof TEMPLATE_ITEMS;
  ScaffoldError: typeof ScaffoldError;
  ERROR_CODES: typeof ERROR_CODES;
};

export default defaultExport;
