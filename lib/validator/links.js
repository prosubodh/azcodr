import fs from 'node:fs';
import path from 'node:path';
import { readTextOrFail } from './io.js';
import { stripFencedCode } from './text.js';
export function errorCode(err) {
    if (err && typeof err === 'object' && 'code' in err) {
        return String(err.code);
    }
    return err instanceof Error ? err.message : String(err);
}
/**
 * Normalises a markdown link destination, discarding external ones.
 *
 * @param rawTarget - Destination exactly as written.
 * @returns The normalised link, or null when it is external or empty.
 */
export function normalizeLinkTarget(rawTarget) {
    let target = rawTarget.trim();
    if (!target)
        return null;
    // Link titles: [x](./a.md "Title"), 'Title' and (Title).
    target = target.replace(/\s+(?:"[^"]*"|'[^']*'|\([^)]*\))$/, '').trim();
    const angled = target.match(/^<([^>]*)>$/);
    if (angled)
        target = angled[1].trim();
    const display = target.split('#')[0].split('?')[0];
    if (!display)
        return null;
    if (/^[a-z][a-z0-9+.-]*:/i.test(display))
        return null;
    if (display.startsWith('//'))
        return null;
    try {
        return { target: decodeURIComponent(display), display };
    }
    catch {
        return { target: display, display };
    }
}
function recordLinkTarget(link, ctx) {
    const normalized = normalizeLinkTarget(link.rawTarget);
    if (normalized === null)
        return;
    ctx.linkCount += 1;
    const resolved = path.normalize(path.join(link.dir, normalized.target));
    if (!fs.existsSync(resolved)) {
        let realFilePath = link.filePath;
        try {
            realFilePath = fs.realpathSync(link.filePath);
        }
        catch { }
        const isRootAgentContract = path.resolve(realFilePath) === path.resolve(ctx.workspaceRoot, 'AGENTS.md') ||
            (path.dirname(path.resolve(link.filePath)) === path.resolve(ctx.workspaceRoot) &&
                path.basename(link.filePath).toLowerCase() === 'agents.md');
        const isUninstalledRule = !fs.existsSync(path.join(ctx.workspaceRoot, 'docs', 'rules')) &&
            (normalized.target.startsWith('./docs/rules/') || normalized.target.startsWith('docs/rules/')) &&
            isRootAgentContract;
        if (isUninstalledRule) {
            return;
        }
        ctx.broken.push(`${path.relative(ctx.workspaceRoot, link.filePath)} -> ${normalized.display}`);
    }
}
/** Scans inline `[text](target)` links, tolerating nested brackets in the text. */
function collectInlineLinks(job, ctx) {
    const inline = /\[((?:[^\][]|\[[^\][]*\])*)\]\(([^)]*)\)/g;
    let match;
    while ((match = inline.exec(job.live)) !== null) {
        recordLinkTarget({ rawTarget: match[2], dir: job.dir, filePath: job.filePath }, ctx);
    }
}
/** Scans reference-style `[ref]: ./target` definitions. */
function collectReferenceLinks(job, ctx) {
    const reference = /^\s{0,3}\[[^\]]+\]:\s*(\S+)/gm;
    let match;
    while ((match = reference.exec(job.live)) !== null) {
        recordLinkTarget({ rawTarget: match[1], dir: job.dir, filePath: job.filePath }, ctx);
    }
}
/** Scans HTML `<a href="./target">` anchors. */
function collectHtmlAnchors(job, ctx) {
    const html = /<a\s[^>]*href\s*=\s*["']([^"']+)["']/gi;
    let match;
    while ((match = html.exec(job.live)) !== null) {
        recordLinkTarget({ rawTarget: match[1], dir: job.dir, filePath: job.filePath }, ctx);
    }
}
/**
 * Checks every internal link in one markdown file.
 *
 * An unreadable file is reported rather than allowed to abort the run: the
 * remaining files still need checking.
 *
 * @param filePath - Markdown file to scan.
 * @param ctx - Validation context.
 */
export function checkFile(filePath, ctx) {
    const label = `markdown file ${path.relative(ctx.workspaceRoot, filePath)}`;
    const content = readTextOrFail(filePath, label, ctx.fail);
    if (content === null)
        return;
    const job = {
        live: stripFencedCode(content),
        dir: path.dirname(filePath),
        filePath
    };
    collectInlineLinks(job, ctx);
    collectReferenceLinks(job, ctx);
    collectHtmlAnchors(job, ctx);
}
function reportUnreadableDir(dir, err, ctx) {
    // A silently-skipped subtree yields "0 broken links" derived from zero
    // coverage, which is the worst outcome a checker can produce: a green
    // result that proves nothing.
    const shown = path.relative(ctx.workspaceRoot, dir) || '.';
    if (err instanceof RangeError) {
        ctx.fail(`Directory traversal exhausted the stack at ${shown}; link validation is incomplete.`);
        return;
    }
    ctx.warn(`Skipped unreadable directory ${shown}: ${errorCode(err)}`);
}
function followSymlinkEntry(full, ctx) {
    let real;
    try {
        real = fs.realpathSync(full);
    }
    catch {
        ctx.warn(`Skipped dangling symlink ${path.relative(ctx.workspaceRoot, full)}`);
        return;
    }
    if (ctx.visitedRealPaths.has(real))
        return;
    ctx.visitedRealPaths.add(real);
    let isDir = false;
    try {
        isDir = fs.statSync(full).isDirectory();
    }
    catch {
        isDir = false;
    }
    if (isDir)
        walk(full, ctx);
    else if (full.endsWith('.md'))
        checkFile(full, ctx);
}
function visitEntry(entry, full, ctx) {
    if (entry.isDirectory()) {
        walk(full, ctx);
        return;
    }
    if (entry.isSymbolicLink()) {
        followSymlinkEntry(full, ctx);
        return;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        if (entry.name.toLowerCase().startsWith('conversation-history'))
            return;
        checkFile(full, ctx);
    }
}
function walk(dir, ctx) {
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    }
    catch (err) {
        reportUnreadableDir(dir, err, ctx);
        return;
    }
    for (const entry of entries) {
        if (entry.name === '.git' ||
            entry.name === 'node_modules' ||
            entry.name === '.tmp' ||
            entry.name === '.tmp-scratch' ||
            entry.name === 'coverage')
            continue;
        visitEntry(entry, path.join(dir, entry.name), ctx);
    }
}
/**
 * Walks the workspace verifying that every internal markdown link resolves.
 *
 * Broken links are the one class of defect this validator treats as blocking
 * everywhere: a dead reference is wrong in any kind of project.
 *
 * @param ctx - Validation context.
 */
export function phaseLinks(ctx) {
    ctx.log('');
    ctx.heading('4. Checking Markdown Internal Links & Cross-References...');
    try {
        ctx.visitedRealPaths.add(fs.realpathSync(ctx.workspaceRoot));
    }
    catch {
        // Unresolvable root: the walk reports each missing file individually.
    }
    walk(ctx.workspaceRoot, ctx);
    if (ctx.broken.length === 0) {
        ctx.pass(`Validated ${ctx.linkCount} internal links across workspace (0 broken links).`);
        return;
    }
    for (const broken of ctx.broken)
        ctx.fail(`Broken markdown link: ${broken}`);
}
//# sourceMappingURL=links.js.map