import { ScaffoldError, ERROR_CODES } from './errors.js';
import type { ScaffoldErrorCode, ScaffoldErrorShape } from './errors.js';
import { runGit } from './git.js';
import { assertInside, isProtectedTarget, getTemplateDir } from './guards.js';
import { ensureSymlink, ensureSymlinkOrPointer, isSameCaseInsensitiveFile } from './links.js';
import type { EnsureSymlinkOptions } from './links.js';
import { makeScriptsExecutable } from './permissions.js';
import { isInsideGitWorkTree, initGit } from './repo.js';
import type { InitGitOptions } from './repo.js';
export { getTemplateDir };
/**
 * Canonical list of template files and directories copied into a new workspace.
 */
export declare const TEMPLATE_ITEMS: readonly string[];
/**
 * Configuration options for the primary scaffold orchestration function.
 */
export interface ScaffoldOptions {
    /** Target directory path where project will be scaffolded (defaults to process.cwd()). */
    targetDir?: string;
    /** Force overwrite if target directory exists and is non-empty. */
    force?: boolean;
    /** Skip git repository initialization. */
    noGit?: boolean;
    /** Optional custom template directory path. */
    templateDir?: string;
    /** Simulate scaffolding without writing files to disk. */
    dryRun?: boolean;
    /** Suppress non-error console output. */
    silent?: boolean;
}
/**
 * Result object returned upon completion of a scaffold operation.
 */
export interface ScaffoldResult {
    /** Whether the scaffolding operation completed successfully. */
    success: boolean;
    /** Absolute filesystem path of the scaffolded target directory. */
    targetDir: string;
    /** Whether a git repository was initialized and committed. */
    gitInitialized: boolean;
    /** Whether execution was a dry-run simulation without disk mutations. */
    dryRun: boolean;
    /** List of recorded scaffolding action descriptions taken. */
    actions: string[];
}
/**
 * Options controlling pre-scaffold target directory validation.
 */
export interface ValidateTargetOptions {
    /** Custom template root directory path. */
    templateDir?: string;
    /** Allow non-empty directory when force is true. */
    force?: boolean;
    /** Simulate validation checks without erroring on non-empty targets. */
    dryRun?: boolean;
    /** Allow targeting protected directories (internal testing only). */
    allowProtected?: boolean;
}
/**
 * Options controlling template file copying and file generation.
 */
export interface CopyTemplateOptions {
    /** Simulate copying without disk mutations. */
    dryRun?: boolean;
}
/**
 * Validates the target directory to ensure it is suitable for scaffolding.
 *
 * @param targetDir - Target directory path to validate.
 * @param options - Validation options including force, dry-run, and protected overrides.
 * @throws {ScaffoldError} When target is invalid, protected, or non-empty without force.
 */
export declare function validateTarget(targetDir: string, options?: ValidateTargetOptions): void;
/**
 * Recursively copies template files into the target directory and sets up symlinks and permissions.
 * Socket note: filesystem access is scoped to templateDir -> targetDir only (assertInside).
 *
 * @param targetDir - Destination directory path.
 * @param templateDir - Source template directory path.
 * @param options - Copy options including dry-run flag.
 * @returns Array of recorded scaffolding action descriptions.
 */
export declare function copyTemplate(targetDir: string, templateDir?: string, options?: CopyTemplateOptions): string[];
/**
 * High-level orchestration function to scaffold the azcodr workspace into targetDir.
 *
 * @param options - Scaffolding options.
 * @returns Result object containing success flag, target directory, and action log.
 */
export declare function scaffold(options?: ScaffoldOptions): ScaffoldResult;
export { ensureSymlink, ensureSymlinkOrPointer, isSameCaseInsensitiveFile, makeScriptsExecutable, isInsideGitWorkTree, initGit, runGit, assertInside, ScaffoldError, ERROR_CODES, isProtectedTarget };
export type { EnsureSymlinkOptions, InitGitOptions, ScaffoldErrorCode, ScaffoldErrorShape };
/**
 * Unified azcodr scaffolding functions, guards, utilities, and constants module.
 */
declare const _default: {
    scaffold: typeof scaffold;
    validateTarget: typeof validateTarget;
    copyTemplate: typeof copyTemplate;
    ensureSymlink: typeof ensureSymlink;
    ensureSymlinkOrPointer: typeof ensureSymlinkOrPointer;
    isSameCaseInsensitiveFile: typeof isSameCaseInsensitiveFile;
    makeScriptsExecutable: typeof makeScriptsExecutable;
    isInsideGitWorkTree: typeof isInsideGitWorkTree;
    initGit: typeof initGit;
    getTemplateDir: typeof getTemplateDir;
    runGit: typeof runGit;
    assertInside: typeof assertInside;
    TEMPLATE_ITEMS: readonly string[];
    ScaffoldError: typeof ScaffoldError;
    ERROR_CODES: {
        readonly E_TARGET_IS_TEMPLATE: "Cannot scaffold into the azcodr template directory itself";
        readonly E_TARGET_NOT_EMPTY: "Target directory is not empty";
        readonly E_TARGET_IS_PROTECTED: "Refusing to scaffold into a protected system directory";
        readonly E_GIT_ARGS_INVALID: "runGit requires a non-empty argv array";
        readonly E_GIT_BLOCKED: "Blocked git subcommand";
        readonly E_PATH_ESCAPE: "Path escapes allowed root";
    };
    isProtectedTarget: typeof isProtectedTarget;
};
export default _default;
//# sourceMappingURL=scaffold.d.ts.map