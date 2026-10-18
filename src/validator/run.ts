import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { checkAdrIndexConsistency, checkGlossaryPopulated } from './adr.js';
import { phaseLinks } from './links.js';
import { createReporter, createSilentReporter, readTextOrFail } from './io.js';
import { phaseRootConfig } from './root.js';
import { phaseRules } from './rules.js';
import { phaseSkills } from './skills.js';
import { phaseToolchain } from './toolchain.js';
import { stripFencedCode, stripHtmlComments } from './text.js';
import type { Reporter, ValidationContext, ValidationResult } from './types.js';

/** Resolves the workspace root from argv, tolerating unknown flags. */
export function parseArgs(argv: readonly string[]): string {
  let root = '';
  for (const arg of argv) {
    if (arg.startsWith('-')) continue;
    if (!root) root = arg;
  }
  return root || process.cwd();
}

function reportMemoryLedger(mem: string, ctx: ValidationContext): void {
  if (!/^# /m.test(mem)) {
    ctx.fail('memory.md missing H1 header');
    return;
  }

  const live = stripFencedCode(stripHtmlComments(mem));
  const entryIds = [...live.matchAll(/^####\s+ADR-(\d+)/gm)].map((m) => Number(m[1]));
  if (entryIds.length > 0) {
    ctx.pass('memory.md contains ADR entries with valid envelope.');
  } else {
    ctx.pass('memory.md is a clean slate (no ADRs yet).');
  }

  // Template ADRs start well past this repo's own range. Match any ID >= 25
  // regardless of zero padding.
  if (Math.max(0, ...entryIds) >= 25 && /azcodr/i.test(mem)) {
    ctx.warn('memory.md may contain template-internal ADRs; fresh projects must start at ADR-001.');
  }
}

function phaseMemory(ctx: ValidationContext): void {
  ctx.log('');
  ctx.heading('5. Checking Decision Ledger...');
  const memoryFile = path.join(ctx.workspaceRoot, 'memory.md');
  if (!fs.existsSync(memoryFile)) {
    ctx.skip('No memory.md present; skipping ledger checks.');
    return;
  }
  // Guarded read: an unreadable ledger must be reported, not thrown, or every
  // later phase is lost to a stack trace.
  const mem = readTextOrFail(memoryFile, 'memory.md', ctx.fail);
  if (mem !== null) reportMemoryLedger(mem, ctx);
}

function phaseLedger(ctx: ValidationContext): void {
  if (!fs.existsSync(path.join(ctx.workspaceRoot, 'memory.md'))) return;
  ctx.log('');
  ctx.heading('6. Checking ADR Index Consistency...');
  const consistency = checkAdrIndexConsistency(ctx.workspaceRoot, ctx.fail, ctx.pass);
  if (consistency === 'indexed' || consistency === 'inconsistent') {
    checkGlossaryPopulated(ctx.workspaceRoot, {
      fail: ctx.fail,
      warn: ctx.warn,
      pass: ctx.pass,
      skip: ctx.skip
    });
  }
}

function buildContext(
  workspaceRoot: string,
  reporter: Reporter,
  counts: { errors: number; warnings: number }
): ValidationContext {
  return {
    workspaceRoot,
    agentsFile: '',
    agentsContent: '',
    pass: reporter.pass,
    warn: (msg) => { counts.warnings += 1; reporter.warn(msg); },
    fail: (msg) => { counts.errors += 1; reporter.fail(msg); },
    skip: reporter.skip ?? (() => {}),
    log: reporter.log,
    heading: reporter.heading,
    linkCount: 0,
    broken: [],
    visitedRealPaths: new Set<string>()
  };
}

function reportSummary(counts: { errors: number; warnings: number }, reporter: Reporter): void {
  reporter.log('');
  reporter.log('--------------------------------------------------------------');
  if (counts.errors === 0) {
    reporter.log('SUCCESS: All agentic configurations are valid and healthy!');
    reporter.log(`SUCCESS: ${counts.warnings} warning(s), 0 error(s).`);
  } else {
    reporter.log(`FAILURE: ${counts.errors} error(s) and ${counts.warnings} warning(s).`);
  }
}

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
export function runValidation(
  workspaceRoot: string,
  reporter: Reporter = createReporter()
): ValidationResult {
  const counts = { errors: 0, warnings: 0 };
  const ctx = buildContext(workspaceRoot, reporter, counts);

  reporter.heading(`Validating Workspace: ${workspaceRoot}`);
  reporter.log('--------------------------------------------------------------');
  phaseRootConfig(ctx);
  const validatedRules = phaseRules(ctx);
  const validatedSkills = phaseSkills(ctx);
  phaseLinks(ctx);
  phaseMemory(ctx);
  phaseLedger(ctx);
  phaseToolchain(ctx);
  reportSummary(counts, reporter);

  return {
    errors: counts.errors,
    warnings: counts.warnings,
    validatedRules,
    validatedSkills,
    totalLinks: ctx.linkCount,
    brokenLinks: ctx.broken
  };
}

/**
 * Process entry point. Injects the exit function so it stays testable.
 *
 * @param argv - Command-line arguments.
 * @param exit - Exit function to call with the process code.
 * @returns The exit code.
 */
export function main(
  argv: readonly string[] = process.argv.slice(2),
  exit: (code: number) => void = process.exit
): number {
  const result = runValidation(path.resolve(parseArgs(argv)));
  const code = result.errors === 0 ? 0 : 1;
  exit(code);
  return code;
}

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
