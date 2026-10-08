/**
 * @module @azcodr/azcodr
 * Enterprise Architecture & Agentic Engineering Starter Template.
 *
 * Provides problem-first, topology-aligned project scaffolding with strict systemic atomicity,
 * filesystem scope guards, git worktree initialization, and multi-agent harness parity.
 */
/**
 * Core scaffolding functions, guards, utilities, error classes, and constants.
 */
export { scaffold, validateTarget, copyTemplate, ensureSymlink, ensureSymlinkOrPointer, isSameCaseInsensitiveFile, makeScriptsExecutable, initGit, isInsideGitWorkTree, runGit, assertInside, isProtectedTarget, getTemplateDir, TEMPLATE_ITEMS, ScaffoldError, ERROR_CODES } from './scaffold.js';
import scaffoldModule from './scaffold.js';
/**
 * Default export providing the unified azcodr scaffolding module.
 */
export default scaffoldModule;
//# sourceMappingURL=index.js.map