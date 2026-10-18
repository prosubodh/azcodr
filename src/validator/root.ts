import fs from 'node:fs';
import path from 'node:path';
import { readTextOrFail } from './io.js';
import { createLowercaseParityLink, evaluateParityTarget } from './parity.js';
import type { ParityVerdict } from './parity.js';
import type { ValidationContext } from './types.js';

/** Line count above which an agent contract starts costing more than it gives. */
const ADVISORY_LINE_LIMIT = 120;

/** Parity files a workspace may maintain, and which are checked if present. */
const PARITY_FILES: readonly string[] = ['CLAUDE.md', 'GEMINI.md', '.cursorrules', '.windsurfrules'];

/** What the filesystem reported about one parity entry. */
interface ObservedEntry {
  missing?: boolean;
  isSymlink: boolean;
  linkTarget: string | null;
  readlinkError?: string;
  isFile: boolean;
  content: string;
  readError?: string;
  entries: string[];
}

function readParityContent(filePath: string, stat: fs.Stats): Partial<ObservedEntry> {
  if (stat.isSymbolicLink()) {
    try {
      return { isSymlink: true, linkTarget: fs.readlinkSync(filePath) };
    } catch (err) {
      return { isSymlink: true, readlinkError: (err as Error).message };
    }
  }
  if (stat.isFile()) {
    try {
      return { isFile: true, content: fs.readFileSync(filePath, 'utf-8') };
    } catch (err) {
      return { isFile: true, readError: (err as Error).message };
    }
  }
  return {};
}

function safeReadDir(dir: string): string[] {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

function observeParityEntry(filePath: string, workspaceRoot: string): ObservedEntry {
  try {
    const stat = fs.lstatSync(filePath);
    return {
      entries: safeReadDir(workspaceRoot),
      isSymlink: false,
      linkTarget: null,
      isFile: false,
      content: '',
      ...readParityContent(filePath, stat)
    };
  } catch {
    return {
      missing: true,
      entries: [],
      isSymlink: false,
      linkTarget: null,
      isFile: false,
      content: ''
    };
  }
}

function reportParityFailure(label: string, observed: ObservedEntry, ctx: ValidationContext): boolean {
  if (observed.missing) {
    ctx.fail(`${label} is missing.`);
  } else if (observed.readlinkError) {
    ctx.fail(`${label} readlink failed: ${observed.readlinkError}`);
  } else if (observed.readError) {
    ctx.fail(`${label} could not be read: ${observed.readError}`);
  } else {
    return false;
  }
  return true;
}

function checkParity(filePath: string, label: string, ctx: ValidationContext): void {
  const observed = observeParityEntry(filePath, ctx.workspaceRoot);
  if (reportParityFailure(label, observed, ctx)) return;

  const verdict: ParityVerdict = evaluateParityTarget({
    label,
    agentsFile: ctx.agentsFile,
    agentsContent: ctx.agentsContent,
    agentsContentMissing: !ctx.agentsContent,
    entries: observed.entries,
    isSymlink: observed.isSymlink,
    linkTarget: observed.linkTarget,
    isFile: observed.isFile,
    content: observed.content,
    allowCopyFallback: true
  });
  if (verdict.kind === 'pass') ctx.pass(verdict.message);
  else if (verdict.kind === 'warn') ctx.warn(verdict.message);
  else ctx.fail(verdict.message);
}

function checkLowercaseParity(ctx: ValidationContext): void {
  const lowerPath = path.join(ctx.workspaceRoot, 'agents.md');
  const rootEntries = safeReadDir(ctx.workspaceRoot);

  const alreadySatisfied = rootEntries.includes('AGENTS.md') && !rootEntries.includes('agents.md');
  if (alreadySatisfied) {
    if (fs.existsSync(lowerPath)) {
      ctx.pass('agents.md is satisfied natively by AGENTS.md (case-insensitive filesystem).');
    } else {
      restoreLowercaseParity(lowerPath, ctx);
    }
    return;
  }
  checkParity(lowerPath, 'agents.md', ctx);
}

function restoreLowercaseParity(lowerPath: string, ctx: ValidationContext): void {
  const outcome = createLowercaseParityLink(lowerPath);
  if (outcome.created) {
    ctx.pass('Created agents.md parity link to AGENTS.md (case-sensitive filesystem).');
    checkParity(lowerPath, 'agents.md', ctx);
  } else {
    ctx.warn(`Could not restore agents.md parity: ${outcome.reason}`);
    ctx.fail(`Could not restore agents.md parity: ${outcome.reason}`);
  }
}

function checkGithubParity(ctx: ValidationContext): void {
  const githubDir = path.join(ctx.workspaceRoot, '.github');
  if (!fs.existsSync(githubDir) || !fs.statSync(githubDir).isDirectory()) return;
  const copilot = path.join(githubDir, 'copilot-instructions.md');
  if (fs.existsSync(copilot)) {
    checkParity(copilot, '.github/copilot-instructions.md', ctx);
  } else {
    ctx.warn('.github/copilot-instructions.md is missing (run scaffold to restore harness parity).');
  }
  if (!fs.existsSync(path.join(githubDir, 'workflows'))) {
    ctx.warn('.github/workflows is missing (CI will not run in scaffolded projects).');
  }
}

/**
 * Verifies that any harness-parity files a project uses agree.
 *
 * @param ctx - Validation context.
 */
export function checkHarnessParity(ctx: ValidationContext): void {
  if (!fs.existsSync(ctx.agentsFile)) {
    ctx.skip('No AGENTS.md present; skipping harness parity checks.');
    return;
  }
  for (const name of PARITY_FILES) {
    const target = path.join(ctx.workspaceRoot, name);
    if (fs.existsSync(target)) checkParity(target, name, ctx);
  }
  checkLowercaseParity(ctx);
}

function checkAgentsFile(ctx: ValidationContext, agentsFile: string): string | null {
  if (!fs.existsSync(agentsFile)) {
    ctx.skip('No AGENTS.md present; skipping agent-contract checks.');
    return null;
  }
  ctx.pass('AGENTS.md exists.');
  const text = readTextOrFail(agentsFile, 'AGENTS.md', ctx.fail);
  if (text === null) return null;
  if (text.trim().length === 0) {
    ctx.fail('AGENTS.md is empty; the root agent contract must define its operating rules.');
    return text;
  }

  const lines = text.split('\n').length;
  if (lines <= ADVISORY_LINE_LIMIT) {
    ctx.pass(`AGENTS.md line count is lean: ${lines} lines (<= 120).`);
  } else {
    ctx.warn(`AGENTS.md line count is getting large: ${lines} lines (warn > 120).`);
  }
  return text;
}

/**
 * Phase 1: the root agent contract and harness parity.
 *
 * @param ctx - Validation context.
 */
export function phaseRootConfig(ctx: ValidationContext): void {
  ctx.heading('1. Checking Root Configuration & Symlinks...');
  const agentsFile = path.join(ctx.workspaceRoot, 'AGENTS.md');
  const text = checkAgentsFile(ctx, agentsFile);
  ctx.agentsFile = agentsFile;
  ctx.agentsContent = text ?? '';

  checkHarnessParity(ctx);
  checkGithubParity(ctx);
  if (fs.existsSync(path.join(ctx.workspaceRoot, '.gitignore'))) {
    ctx.pass('.gitignore exists.');
  } else {
    ctx.skip('No .gitignore present; skipping gitignore checks.');
  }
}

export { checkParity };
