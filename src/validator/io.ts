import fs from 'node:fs';
import path from 'node:path';
import type { FailFn, Reporter } from './types.js';

/** Minimal surface of a log sink, so tests can capture output. */
export interface LogSink {
  log: (msg: string) => void;
}

/**
 * Builds a reporter that prefixes each severity with a distinct marker.
 *
 * @param sink - Destination for formatted lines; defaults to the console.
 * @returns A reporter suitable for the validator orchestrator.
 */
export function createReporter(sink: LogSink = console): Reporter {
  return {
    pass: (msg) => sink.log(`  ✅ ${msg}`),
    warn: (msg) => sink.log(`  ⚠️  ${msg}`),
    fail: (msg) => sink.log(`  ❌ ${msg}`),
    skip: (msg) => sink.log(`  ⏭️  SKIP ${msg}`),
    log: (msg) => sink.log(msg),
    heading: (msg) => sink.log(msg)
  };
}

/** A reporter that discards everything, for callers that only need the tally. */
export function createSilentReporter(): Reporter {
  const noop = (): void => {};
  return { pass: noop, warn: noop, fail: noop, skip: noop, log: noop, heading: noop };
}

export function errorCode(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    return String((err as NodeJS.ErrnoException).code);
  }
  return err instanceof Error ? err.message : String(err);
}

/**
 * Reads a UTF-8 text file, reporting rather than throwing on failure.
 *
 * An unguarded read crashes the whole run on a directory named `*.md`, an
 * unreadable file or a broken symlink, aborting every later phase and emitting
 * a stack trace instead of a verdict.
 *
 * @param filePath - File to read.
 * @param label - Human name used in messages.
 * @param fail - Failure reporter.
 * @returns File contents, or null when the file could not be read.
 */
export function readTextOrFail(filePath: string, label: string, fail: FailFn): string | null {
  try {
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      const kind = stats.isDirectory() ? 'it is a directory' : 'special file';
      fail(`${label} is not a regular file (${kind}).`);
      return null;
    }
    return fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    fail(`Could not read ${label}: ${errorCode(err)}`);
    return null;
  }
}

/**
 * Recursively collects markdown files under a directory.
 *
 * @param root - Directory to walk.
 * @param label - Human name used in messages.
 * @param fail - Failure reporter.
 * @returns Sorted list of absolute markdown paths.
 */
export function walkMarkdown(root: string, label: string, fail?: FailFn): string[] {
  const found: string[] = [];
  const stack: string[] = [root];
  while (stack.length > 0) {
    const dir = stack.pop() as string;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      if (fail) fail(`Could not list ${label} directory ${dir}: ${errorCode(err)}`);
      continue;
    }
    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name.toLowerCase().endsWith('.md')) found.push(full);
    }
  }
  return found.sort();
}

/**
 * Lists skill directories under a skills root.
 *
 * @param skillsDir - Directory containing one folder per skill.
 * @param fail - Failure reporter.
 * @returns Sorted skill directory names.
 */
export function readSkillFolders(skillsDir: string, fail: FailFn): string[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  } catch (err) {
    fail(`Could not list skills directory: ${errorCode(err)}`);
    return [];
  }
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}
