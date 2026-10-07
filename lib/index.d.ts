export type ScaffoldErrorCode = 'E_TARGET_IS_TEMPLATE' | 'E_TARGET_NOT_EMPTY' | 'E_TARGET_IS_PROTECTED' | 'E_GIT_ARGS_INVALID' | 'E_GIT_BLOCKED' | 'E_PATH_ESCAPE';
export { scaffold, validateTarget, copyTemplate, ensureSymlink, ensureSymlinkOrPointer, isSameCaseInsensitiveFile, makeScriptsExecutable, initGit, isInsideGitWorkTree, runGit, assertInside, isProtectedTarget, getTemplateDir, TEMPLATE_ITEMS, ScaffoldError, ERROR_CODES } from './scaffold.js';
export type { ScaffoldOptions, ScaffoldResult, ValidateTargetOptions, CopyTemplateOptions, EnsureSymlinkOptions, InitGitOptions, ScaffoldErrorShape } from './scaffold.js';
import scaffoldModule from './scaffold.js';
export default scaffoldModule;
//# sourceMappingURL=index.d.ts.map