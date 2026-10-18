import type { ValidationContext } from './types.js';
/** A link target after normalisation. */
export interface NormalizedLink {
    /** Decoded target suitable for filesystem resolution. */
    target: string;
    /** Target exactly as written, used in messages. */
    display: string;
}
export declare function errorCode(err: unknown): string;
/**
 * Normalises a markdown link destination, discarding external ones.
 *
 * @param rawTarget - Destination exactly as written.
 * @returns The normalised link, or null when it is external or empty.
 */
export declare function normalizeLinkTarget(rawTarget: string): NormalizedLink | null;
/**
 * Checks every internal link in one markdown file.
 *
 * An unreadable file is reported rather than allowed to abort the run: the
 * remaining files still need checking.
 *
 * @param filePath - Markdown file to scan.
 * @param ctx - Validation context.
 */
export declare function checkFile(filePath: string, ctx: ValidationContext): void;
/**
 * Walks the workspace verifying that every internal markdown link resolves.
 *
 * Broken links are the one class of defect this validator treats as blocking
 * everywhere: a dead reference is wrong in any kind of project.
 *
 * @param ctx - Validation context.
 */
export declare function phaseLinks(ctx: ValidationContext): void;
//# sourceMappingURL=links.d.ts.map