/**
 * @module @azcodr/azcodr
 * Enterprise Architecture & Agentic Engineering Starter Template.
 *
 * Provides problem-first, topology-aligned project scaffolding with strict systemic atomicity,
 * filesystem scope guards, git worktree initialization, and multi-agent harness parity.
 */

/**
 * Union type of all valid machine-readable error codes.
 */
export type ScaffoldErrorCode =
  | 'E_TARGET_IS_TEMPLATE'
  | 'E_TARGET_NOT_EMPTY'
  | 'E_TARGET_IS_PROTECTED'
  | 'E_GIT_ARGS_INVALID'
  | 'E_GIT_BLOCKED'
  | 'E_PATH_ESCAPE';

/**
 * Core scaffolding functions, guards, utilities, error classes, and constants.
 */
export {
  scaffold,
  validateTarget,
  copyTemplate,
  ensureSymlink,
  ensureSymlinkOrPointer,
  isSameCaseInsensitiveFile,
  makeScriptsExecutable,
  initGit,
  isInsideGitWorkTree,
  runGit,
  assertInside,
  isProtectedTarget,
  getTemplateDir,
  TEMPLATE_ITEMS,
  ScaffoldError,
  ERROR_CODES
} from './scaffold.js';

/**
 * Standalone architecture validation engine.
 */
export { validate, createSilentReporter } from './validate.js';
export type { ValidationResult, ValidationReporter } from './validate.js';

/**
 * Agent-runtime architectural enforcement and safety guards.
 */
export {
  inspectPreTool,
  inspectCommand,
  inspectFileWrite,
  inspectTddRequirement,
  readTddState,
  writeTddState
} from './agent-guard.js';
export type {
  GuardDecision,
  GuardOptions,
  ToolEnvelope,
  CommandViolation,
  FileCheckResult,
  SessionTddState
} from './agent-guard.js';

/**
 * Type definitions and option interfaces for scaffolding operations.
 */
export type {
  ScaffoldOptions,
  ScaffoldResult,
  ValidateTargetOptions,
  CopyTemplateOptions,
  EnsureSymlinkOptions,
  InitGitOptions,
  ScaffoldErrorShape
} from './scaffold.js';

import scaffoldModule from './scaffold.js';

/**
 * Default export providing the unified azcodr scaffolding module.
 */
export default scaffoldModule;
