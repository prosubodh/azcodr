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
/**
 * The three target spellings a parity file may legitimately use.
 *
 * @param target - Observed link target.
 * @param agentsFile - Absolute path of the agent contract.
 * @returns True when the target names the agent contract.
 */
export declare function isValidAgentsTarget(target: string, agentsFile: string): boolean;
/**
 * Decides whether a harness-parity entry is healthy, drifting, or wrong.
 *
 * @param ctx - What the filesystem calls observed.
 * @returns The verdict to report.
 */
export declare function evaluateParityTarget(ctx: ParityObservation): ParityVerdict;
export declare function reasonFor(err: unknown): string;
/**
 * Creates the lowercase parity link, preferring a real symlink and falling back
 * to a text pointer. Never throws: an unrecoverable workspace is reported so
 * the caller can surface it.
 *
 * @param lowerPath - Path of the lowercase link to create.
 * @param fsImpl - Filesystem surface, overridable for fault injection.
 * @returns Whether creation succeeded and which strategy was used.
 */
export declare function createLowercaseParityLink(lowerPath: string, fsImpl?: FsLike): ParityLinkResult;
/** Re-exported so callers can build a reporter without importing io. */
export type { FailFn, PassFn };
//# sourceMappingURL=parity.d.ts.map