import fs from 'node:fs';
import type { FailFn, PassFn } from './types.js';

/** What `lstat`/`readlink`/`readFile` observed about a parity entry. */
export interface ParityObservation {
  /** Display name, e.g. 'CLAUDE.md'. */
  label: string;
  /** Absolute path of the agent contract. */
  agentsFile: string;
  /** Absolute path of the agent contract, as observed. */
  agentsContent: string;
  /** True when the agent contract could not be read. */
  agentsContentMissing: boolean;
  /** Names present in the workspace root. */
  entries: string[];
  /** True when the entry is a symbolic link. */
  isSymlink: boolean;
  /** Raw link target when symlinked. */
  linkTarget: string | null;
  /** True when the entry is a regular file. */
  isFile: boolean;
  /** Contents when the entry is a regular file. */
  content: string;
  /** Whether a byte-identical copy is acceptable. */
  allowCopyFallback: boolean;
}

/** The verdict for one parity entry. */
export interface ParityVerdict {
  kind: 'pass' | 'warn' | 'fail';
  message: string;
}

/** Outcome of attempting to create the lowercase parity link. */
export interface ParityLinkResult {
  created: boolean;
  strategy: 'symlink' | 'pointer' | null;
  reason: string | null;
}

/** Minimal filesystem surface used to create a parity link. */
export interface FsLike {
  symlinkSync: (target: string, linkPath: string) => void;
  writeFileSync: (file: string, data: string, encoding: 'utf-8') => void;
}

function toPosix(value: string): string {
  return value.replace(/\\/g, '/');
}

/**
 * The three target spellings a parity file may legitimately use.
 *
 * @param target - Observed link target.
 * @param agentsFile - Absolute path of the agent contract.
 * @returns True when the target names the agent contract.
 */
export function isValidAgentsTarget(target: string, agentsFile: string): boolean {
  const normalized = toPosix(target);
  return (
    normalized === 'AGENTS.md' ||
    normalized === './AGENTS.md' ||
    normalized === toPosix(agentsFile)
  );
}

function symlinkVerdict(ctx: ParityObservation): ParityVerdict {
  const target = ctx.linkTarget as string;
  const isCopilot = ctx.label.endsWith('copilot-instructions.md');
  const ok = isCopilot
    ? toPosix(target) === '../AGENTS.md' ||
      toPosix(target) === toPosix(ctx.agentsFile) ||
      toPosix(target) === 'AGENTS.md'
    : isValidAgentsTarget(target, ctx.agentsFile);

  return ok
    ? { kind: 'pass', message: `${ctx.label} is a valid symlink to AGENTS.md.` }
    : { kind: 'fail', message: `${ctx.label} points to '${target}' instead of 'AGENTS.md'.` };
}

function textPointerVerdict(ctx: ParityObservation): ParityVerdict | null {
  const trimmed = ctx.content.trim();
  if (trimmed === 'AGENTS.md' || trimmed === './AGENTS.md' || trimmed === ctx.agentsFile) {
    return { kind: 'pass', message: `${ctx.label} is a text pointer to AGENTS.md (symlink fallback).` };
  }
  if (ctx.label.endsWith('copilot-instructions.md') && ctx.content.includes('AGENTS.md')) {
    return { kind: 'pass', message: `${ctx.label} references AGENTS.md (symlink fallback).` };
  }
  return null;
}

function copyFallbackVerdict(ctx: ParityObservation): ParityVerdict | null {
  const identical =
    ctx.allowCopyFallback &&
    !ctx.agentsContentMissing &&
    ctx.agentsContent.length > 0 &&
    ctx.content === ctx.agentsContent;
  if (!identical) return null;
  return {
    kind: 'warn',
    message: `${ctx.label} is a byte-identical copy of AGENTS.md (symlink fallback; drift risk).`
  };
}

function caseInsensitiveVerdict(ctx: ParityObservation): ParityVerdict | null {
  if (ctx.label === 'agents.md' && !ctx.entries.includes('agents.md') && ctx.entries.includes('AGENTS.md')) {
    return {
      kind: 'pass',
      message: 'agents.md is satisfied natively by AGENTS.md (case-insensitive filesystem).'
    };
  }
  return null;
}

function fileVerdict(ctx: ParityObservation): ParityVerdict {
  return (
    textPointerVerdict(ctx) ??
    copyFallbackVerdict(ctx) ??
    caseInsensitiveVerdict(ctx) ?? { kind: 'fail', message: `${ctx.label} is not a symbolic link.` }
  );
}

/**
 * Decides whether a harness-parity entry is healthy, drifting, or wrong.
 *
 * @param ctx - What the filesystem calls observed.
 * @returns The verdict to report.
 */
export function evaluateParityTarget(ctx: ParityObservation): ParityVerdict {
  if (ctx.isSymlink) return symlinkVerdict(ctx);
  if (ctx.isFile) return fileVerdict(ctx);
  return {
    kind: 'fail',
    message: `${ctx.label} is neither a symlink nor a regular file.`
  };
}

export function reasonFor(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    return String((err as NodeJS.ErrnoException).code);
  }
  return err instanceof Error ? err.message : String(err);
}

/**
 * Creates the lowercase parity link, preferring a real symlink and falling back
 * to a text pointer. Never throws: an unrecoverable workspace is reported so
 * the caller can surface it.
 *
 * @param lowerPath - Path of the lowercase link to create.
 * @param fsImpl - Filesystem surface, overridable for fault injection.
 * @returns Whether creation succeeded and which strategy was used.
 */
export function createLowercaseParityLink(
  lowerPath: string,
  fsImpl: FsLike = fs
): ParityLinkResult {
  try {
    fsImpl.symlinkSync('AGENTS.md', lowerPath);
    return { created: true, strategy: 'symlink', reason: null };
  } catch (symlinkErr) {
    // Symlinks unavailable (Windows without Developer Mode): a text pointer
    // preserves the invariant without duplicating content.
    try {
      fsImpl.writeFileSync(lowerPath, 'AGENTS.md\n', 'utf-8');
      return { created: true, strategy: 'pointer', reason: null };
    } catch (writeErr) {
      return {
        created: false,
        strategy: null,
        reason:
          `symlink failed (${reasonFor(symlinkErr)}); ` +
          `pointer write failed (${reasonFor(writeErr)})`
      };
    }
  }
}

/** Re-exported so callers can build a reporter without importing io. */
export type { FailFn, PassFn };
