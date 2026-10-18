import fs from 'node:fs';
function toPosix(value) {
    return value.replace(/\\/g, '/');
}
/**
 * The three target spellings a parity file may legitimately use.
 *
 * @param target - Observed link target.
 * @param agentsFile - Absolute path of the agent contract.
 * @returns True when the target names the agent contract.
 */
export function isValidAgentsTarget(target, agentsFile) {
    const normalized = toPosix(target);
    return (normalized === 'AGENTS.md' ||
        normalized === './AGENTS.md' ||
        normalized === toPosix(agentsFile));
}
function symlinkVerdict(ctx) {
    const target = ctx.linkTarget;
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
function textPointerVerdict(ctx) {
    const trimmed = ctx.content.trim();
    if (trimmed === 'AGENTS.md' || trimmed === './AGENTS.md' || trimmed === ctx.agentsFile) {
        return { kind: 'pass', message: `${ctx.label} is a text pointer to AGENTS.md (symlink fallback).` };
    }
    if (ctx.label.endsWith('copilot-instructions.md') && ctx.content.includes('AGENTS.md')) {
        return { kind: 'pass', message: `${ctx.label} references AGENTS.md (symlink fallback).` };
    }
    return null;
}
function copyFallbackVerdict(ctx) {
    const identical = ctx.allowCopyFallback &&
        !ctx.agentsContentMissing &&
        ctx.agentsContent.length > 0 &&
        ctx.content === ctx.agentsContent;
    if (!identical)
        return null;
    return {
        kind: 'warn',
        message: `${ctx.label} is a byte-identical copy of AGENTS.md (symlink fallback; drift risk).`
    };
}
function caseInsensitiveVerdict(ctx) {
    if (ctx.label === 'agents.md' && !ctx.entries.includes('agents.md') && ctx.entries.includes('AGENTS.md')) {
        return {
            kind: 'pass',
            message: 'agents.md is satisfied natively by AGENTS.md (case-insensitive filesystem).'
        };
    }
    return null;
}
function fileVerdict(ctx) {
    return (textPointerVerdict(ctx) ??
        copyFallbackVerdict(ctx) ??
        caseInsensitiveVerdict(ctx) ?? { kind: 'fail', message: `${ctx.label} is not a symbolic link.` });
}
/**
 * Decides whether a harness-parity entry is healthy, drifting, or wrong.
 *
 * @param ctx - What the filesystem calls observed.
 * @returns The verdict to report.
 */
export function evaluateParityTarget(ctx) {
    if (ctx.isSymlink)
        return symlinkVerdict(ctx);
    if (ctx.isFile)
        return fileVerdict(ctx);
    return {
        kind: 'fail',
        message: `${ctx.label} is neither a symlink nor a regular file.`
    };
}
export function reasonFor(err) {
    if (err && typeof err === 'object' && 'code' in err) {
        return String(err.code);
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
export function createLowercaseParityLink(lowerPath, fsImpl = fs) {
    try {
        fsImpl.symlinkSync('AGENTS.md', lowerPath);
        return { created: true, strategy: 'symlink', reason: null };
    }
    catch (symlinkErr) {
        // Symlinks unavailable (Windows without Developer Mode): a text pointer
        // preserves the invariant without duplicating content.
        try {
            fsImpl.writeFileSync(lowerPath, 'AGENTS.md\n', 'utf-8');
            return { created: true, strategy: 'pointer', reason: null };
        }
        catch (writeErr) {
            return {
                created: false,
                strategy: null,
                reason: `symlink failed (${reasonFor(symlinkErr)}); ` +
                    `pointer write failed (${reasonFor(writeErr)})`
            };
        }
    }
}
//# sourceMappingURL=parity.js.map