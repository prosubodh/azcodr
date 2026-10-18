import type { Reporter, ValidationResult } from './types.js';
/** Resolves the workspace root from argv, tolerating unknown flags. */
export declare function parseArgs(argv: readonly string[]): string;
/**
 * Runs every validation phase against a workspace.
 *
 * Checks whose subject is absent are skipped rather than failed, so a
 * repository that uses none of this harness still validates cleanly. A broken
 * internal link or an inconsistent decision index still fails, because those
 * are defects in any kind of project.
 *
 * @param workspaceRoot - Absolute path to the workspace.
 * @param reporter - Optional reporter; defaults to a console reporter.
 * @returns Error and warning tallies plus per-phase counts.
 */
export declare function runValidation(workspaceRoot: string, reporter?: Reporter): ValidationResult;
/**
 * Process entry point. Injects the exit function so it stays testable.
 *
 * @param argv - Command-line arguments.
 * @param exit - Exit function to call with the process code.
 * @returns The exit code.
 */
export declare function main(argv?: readonly string[], exit?: (code: number) => void): number;
export { createReporter, createSilentReporter, walkMarkdown, readTextOrFail, readSkillFolders } from './io.js';
export { parseAdrLedger, checkAdrIndexConsistency, checkGlossaryPopulated } from './adr.js';
export { evaluateParityTarget, isValidAgentsTarget, createLowercaseParityLink } from './parity.js';
export { checkFile, normalizeLinkTarget, phaseLinks } from './links.js';
export { phaseRootConfig, checkHarnessParity } from './root.js';
export { phaseRules, checkOneRule } from './rules.js';
export { phaseSkills, checkOneSkill, extractSkillDescription, frontMatterBlock } from './skills.js';
export { phaseToolchain, readProfileLanguage, expectedToolchainFiles, TOOLCHAIN_FILES } from './toolchain.js';
export { stripHtmlComments, stripFencedCode } from './text.js';
export type { Reporter, ValidationResult, ValidationContext } from './types.js';
//# sourceMappingURL=run.d.ts.map