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
  isSameCaseInsensitiveFile: typeof isSameCaseInsensitiveFile;
  makeScriptsExecutable: typeof makeScriptsExecutable;
  initGit: typeof initGit;
  getTemplateDir: typeof getTemplateDir;
  TEMPLATE_ITEMS: typeof TEMPLATE_ITEMS;
};

export default defaultExport;
