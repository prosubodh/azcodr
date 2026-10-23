/**
 * @module @azcodr/azcodr
 *
 * A workspace governance toolkit. It provides a declarative configuration
 * format, mechanical safety checks, and scaffolding — but no methodology by
 * default. What a project enforces is declared in `harness.yaml`; what it does
 * not declare is not enforced.
 */
export type { HarnessConfig, CheckDeclaration, ProjectFacts, AppliesWhen, Severity, Methodology } from './harness-config.js';
export type { ValidationContext, ValidationResult, Reporter as ValidationReporter } from './validator/types.js';
export { loadHarnessConfig, parseHarnessConfig, defaultConfig, HarnessConfigError, CONFIG_FILE_NAMES, CORE_CHECK_IDS, OPTIONAL_CHECK_IDS, KNOWN_CHECK_IDS, SUPPORTED_VERSION } from './harness-config.js';
export { resolveChecks, explainCheck, matchGlob, matchesAny } from './harness-resolve.js';
export type { ResolvedCheck } from './harness-resolve.js';
export { parseYamlSubset, YamlSubsetError } from './yaml-subset.js';
/**
 * Agent-runtime enforcement: destructive-command safety, an opt-in file-size
 * budget, and opt-in test-first discipline.
 */
export { inspectPreTool, inspectCommand, inspectFileWrite, inspectTddRequirement, readTddState, writeTddState } from './agent-guard.js';
export type { GuardDecision, GuardOptions, ToolEnvelope, CommandViolation, FileCheckResult, SessionTddState, PathMatcher, TddEnforcement, TddCheckResult } from './agent-guard.js';
/**
 * Dependency-cycle detection, plus layer boundaries when a project declares
 * its own layer vocabulary.
 */
export { inspectBoundaries, detectDependencyCycles, detectBoundaryViolations, findSourceFiles, extractLocalImports, buildDependencyGraph, DEFAULT_SCAN_EXTENSIONS } from './boundaries.js';
export type { BoundaryRule, BoundaryViolation, BoundaryReport, ScanOptions } from './boundaries.js';
/**
 * Workspace validation: internal link integrity, decision-index consistency,
 * and structural checks for whatever governance files a project actually keeps.
 * Checks whose subject is absent are skipped, never failed.
 */
export { runValidation, parseArgs, main, createReporter, walkMarkdown, readTextOrFail, readSkillFolders, parseAdrLedger, checkAdrIndexConsistency, checkGlossaryPopulated, evaluateParityTarget, isValidAgentsTarget, createLowercaseParityLink, checkFile, normalizeLinkTarget, phaseLinks, phaseRootConfig, checkHarnessParity, phaseRules, checkOneRule, phaseSkills, checkOneSkill, extractSkillDescription, frontMatterBlock, phaseToolchain, readProfileLanguage, expectedToolchainFiles, TOOLCHAIN_FILES, stripHtmlComments, stripFencedCode } from './validator/run.js';
export { validate } from './validate.js';
export { createSilentReporter } from './validator/io.js';
export { scaffold, validateTarget, copyTemplate, ensureSymlink, ensureSymlinkOrPointer, isSameCaseInsensitiveFile, makeScriptsExecutable, initGit, installPrePushHook, isInsideGitWorkTree, runGit, assertInside, isProtectedTarget, getTemplateDir, purgeAzcodrTests, TEMPLATE_ITEMS, ScaffoldError, ERROR_CODES } from './scaffold.js';
export type { ScaffoldOptions, ScaffoldResult, ValidateTargetOptions, CopyTemplateOptions, EnsureSymlinkOptions, InitGitOptions, InstallHookOptions, InstallHookResult, ScaffoldErrorShape, ScaffoldErrorCode } from './scaffold.js';
/**
 * Prompt Ledger & Zero-Unattended-Prompt Invariant enforcement.
 */
export { parsePromptLedger, checkPromptLedger, resolveLedgerPath, inspectPromptCommit, pruneCompletedLedger } from './prompt-ledger.js';
export type { PromptDirective, PromptLedgerStatus, PromptCommitInspection, PromptPruneResult } from './prompt-ledger.js';
export { handlePromptCommand } from './cli-prompt.js';
export type { PromptIo } from './cli-prompt.js';
/**
 * Capability pack installation and governance definitions.
 */
export { installPack, getPackDefinition, KNOWN_PACK_NAMES } from './pack.js';
export type { CapabilityPack, InstallPackOptions, InstallPackResult, PackCheckDefinition } from './pack.js';
export { handleAddCommand } from './cli-add.js';
export type { AddIo } from './cli-add.js';
/**
 * Workflow template installation for CI/CD pipelines.
 */
export { installWorkflowTemplate, WORKFLOW_DESCRIPTORS } from './workflow.js';
export type { InstallWorkflowOptions, InstallWorkflowResult, WorkflowDescriptor } from './workflow.js';
/**
 * Multi-provider conversation memory exporter.
 */
export { parseTranscriptJsonl, formatTranscriptToMarkdown, exportConversationToFile } from './conversation-export.js';
export type { TranscriptStep, ToolCallInfo, FormatOptions, ExportResult } from './conversation-export.js';
import scaffoldModule from './scaffold.js';
/** Default export: the scaffolding surface, for `import azcodr from '@azcodr/azcodr'`. */
export default scaffoldModule;
//# sourceMappingURL=index.d.ts.map