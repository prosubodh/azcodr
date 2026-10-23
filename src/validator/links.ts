import fs from 'node:fs';
import path from 'node:path';
import { readTextOrFail } from './io.js';
import { stripFencedCode } from './text.js';
import type { ValidationContext } from './types.js';

/** A link target after normalisation. */
export interface NormalizedLink {
  /** Decoded target suitable for filesystem resolution. */
  target: string;
  /** Target exactly as written, used in messages. */
  display: string;
}

/** A link discovered in one file. */
interface DiscoveredLink {
  rawTarget: string;
  dir: string;
  filePath: string;
}

/** Mutable state carried through a single file's link scan. */
interface LinkJob {
  live: string;
  dir: string;
  filePath: string;
}

export function errorCode(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    return String((err as NodeJS.ErrnoException).code);
  }
  return err instanceof Error ? err.message : String(err);
}

/**
 * Normalises a markdown link destination, discarding external ones.
 *
 * @param rawTarget - Destination exactly as written.
 * @returns The normalised link, or null when it is external or empty.
 */
export function normalizeLinkTarget(rawTarget: string): NormalizedLink | null {
  let target = rawTarget.trim();
  if (!target) return null;

  // Link titles: [x](./a.md "Title"), 'Title' and (Title).
  target = target.replace(/\s+(?:"[^"]*"|'[^']*'|\([^)]*\))$/, '').trim();
  const angled = target.match(/^<([^>]*)>$/);
  if (angled) target = (angled[1] as string).trim();

  const display = (target.split('#')[0] as string).split('?')[0] as string;
  if (!display) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(display)) return null;
  if (display.startsWith('//')) return null;

  try {
    return { target: decodeURIComponent(display), display };
  } catch {
    return { target: display, display };
  }
}

function recordLinkTarget(link: DiscoveredLink, ctx: ValidationContext): void {
  const normalized = normalizeLinkTarget(link.rawTarget);
  if (normalized === null) return;
  ctx.linkCount += 1;
  const resolved = path.normalize(path.join(link.dir, normalized.target));
  if (!fs.existsSync(resolved)) {
    ctx.broken.push(
      `${path.relative(ctx.workspaceRoot, link.filePath)} -> ${normalized.display}`
    );
  }
}

/** Scans inline `[text](target)` links, tolerating nested brackets in the text. */
function collectInlineLinks(job: LinkJob, ctx: ValidationContext): void {
  const inline = /\[((?:[^\][]|\[[^\][]*\])*)\]\(([^)]*)\)/g;
  let match: RegExpExecArray | null;
  while ((match = inline.exec(job.live)) !== null) {
    recordLinkTarget({ rawTarget: match[2] as string, dir: job.dir, filePath: job.filePath }, ctx);
  }
}

/** Scans reference-style `[ref]: ./target` definitions. */
function collectReferenceLinks(job: LinkJob, ctx: ValidationContext): void {
  const reference = /^\s{0,3}\[[^\]]+\]:\s*(\S+)/gm;
  let match: RegExpExecArray | null;
  while ((match = reference.exec(job.live)) !== null) {
    recordLinkTarget({ rawTarget: match[1] as string, dir: job.dir, filePath: job.filePath }, ctx);
  }
}

/** Scans HTML `<a href="./target">` anchors. */
function collectHtmlAnchors(job: LinkJob, ctx: ValidationContext): void {
  const html = /<a\s[^>]*href\s*=\s*["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = html.exec(job.live)) !== null) {
    recordLinkTarget({ rawTarget: match[1] as string, dir: job.dir, filePath: job.filePath }, ctx);
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
export function checkFile(filePath: string, ctx: ValidationContext): void {
  const label = `markdown file ${path.relative(ctx.workspaceRoot, filePath)}`;
  const content = readTextOrFail(filePath, label, ctx.fail);
  if (content === null) return;

  const job: LinkJob = {
    live: stripFencedCode(content),
    dir: path.dirname(filePath),
    filePath
  };
  collectInlineLinks(job, ctx);
  collectReferenceLinks(job, ctx);
  collectHtmlAnchors(job, ctx);
}

function reportUnreadableDir(dir: string, err: unknown, ctx: ValidationContext): void {
  // A silently-skipped subtree yields "0 broken links" derived from zero
  // coverage, which is the worst outcome a checker can produce: a green
  // result that proves nothing.
  const shown = path.relative(ctx.workspaceRoot, dir) || '.';
  if (err instanceof RangeError) {
    ctx.fail(
      `Directory traversal exhausted the stack at ${shown}; link validation is incomplete.`
    );
    return;
  }
  ctx.warn(`Skipped unreadable directory ${shown}: ${errorCode(err)}`);
}

function followSymlinkEntry(full: string, ctx: ValidationContext): void {
  let real: string;
  try {
    real = fs.realpathSync(full);
  } catch {
    ctx.warn(`Skipped dangling symlink ${path.relative(ctx.workspaceRoot, full)}`);
    return;
  }
  if (ctx.visitedRealPaths.has(real)) return;
  ctx.visitedRealPaths.add(real);

  let isDir = false;
  try {
    isDir = fs.statSync(full).isDirectory();
  } catch {
    isDir = false;
  }
  if (isDir) walk(full, ctx);
  else if (full.endsWith('.md')) checkFile(full, ctx);
}

function visitEntry(entry: fs.Dirent, full: string, ctx: ValidationContext): void {
  if (entry.isDirectory()) {
    walk(full, ctx);
    return;
  }
  if (entry.isSymbolicLink()) {
    followSymlinkEntry(full, ctx);
    return;
  }
  if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
    if (entry.name.toLowerCase().startsWith('conversation-history')) return;
    checkFile(full, ctx);
  }
}

function walk(dir: string, ctx: ValidationContext): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    reportUnreadableDir(dir, err, ctx);
    return;
  }
  for (const entry of entries) {
    if (
      entry.name === '.git' ||
      entry.name === 'node_modules' ||
      entry.name === '.tmp' ||
      entry.name === '.tmp-scratch' ||
      entry.name === 'coverage'
    ) continue;
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
export function phaseLinks(ctx: ValidationContext): void {
  ctx.log('');
  ctx.heading('4. Checking Markdown Internal Links & Cross-References...');
  try {
    ctx.visitedRealPaths.add(fs.realpathSync(ctx.workspaceRoot));
  } catch {
    // Unresolvable root: the walk reports each missing file individually.
  }
  walk(ctx.workspaceRoot, ctx);

  if (ctx.broken.length === 0) {
    ctx.pass(`Validated ${ctx.linkCount} internal links across workspace (0 broken links).`);
    return;
  }
  for (const broken of ctx.broken) ctx.fail(`Broken markdown link: ${broken}`);
}
