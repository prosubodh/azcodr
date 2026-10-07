import { ScaffoldError, ERROR_CODES } from './errors.js';
import type { ScaffoldErrorCode, ScaffoldErrorShape } from './errors.js';
import { runGit } from './git.js';
import { assertInside, isProtectedTarget } from './guards.js';
import { ensureSymlink, ensureSymlinkOrPointer, isSameCaseInsensitiveFile } from './links.js';
import type { EnsureSymlinkOptions } from './links.js';
import { makeScriptsExecutable } from './permissions.js';
import { isInsideGitWorkTree, initGit } from './repo.js';
import type { InitGitOptions } from './repo.js';
export declare const TEMPLATE_ITEMS: readonly string[];
export interface ScaffoldOptions {
    targetDir?: string;
    force?: boolean;
    noGit?: boolean;
    templateDir?: string;
    dryRun?: boolean;
    silent?: boolean;
}
export interface ScaffoldResult {
    success: boolean;
    targetDir: string;
    gitInitialized: boolean;
    dryRun: boolean;
    actions: string[];
}
export interface ValidateTargetOptions {
    templateDir?: string;
    force?: boolean;
    dryRun?: boolean;
    allowProtected?: boolean;
}
export interface CopyTemplateOptions {
    dryRun?: boolean;
}
/**
 * Returns the root path to the azcodr template files.
 */
export declare function getTemplateDir(): string;
/**
 * Validates the target directory to ensure it is suitable for scaffolding.
 */
export declare function validateTarget(targetDir: string, options?: ValidateTargetOptions): void;
/**
 * Recursively copies template files into the target directory and sets up symlinks and permissions.
 * Socket note: filesystem access is scoped to templateDir -> targetDir only (assertInside).
 */
export declare function copyTemplate(targetDir: string, templateDir?: string, options?: CopyTemplateOptions): string[];
/**
 * High-level orchestration function to scaffold the azcodr workspace into targetDir.
 */
export declare function scaffold(options?: ScaffoldOptions): ScaffoldResult;
export { ensureSymlink, ensureSymlinkOrPointer, isSameCaseInsensitiveFile, makeScriptsExecutable, isInsideGitWorkTree, initGit, runGit, assertInside, ScaffoldError, ERROR_CODES, isProtectedTarget };
export type { EnsureSymlinkOptions, InitGitOptions, ScaffoldErrorCode, ScaffoldErrorShape };
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