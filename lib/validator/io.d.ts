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
export declare function createReporter(sink?: LogSink): Reporter;
/** A reporter that discards everything, for callers that only need the tally. */
export declare function createSilentReporter(): Reporter;
export declare function errorCode(err: unknown): string;
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
export declare function readTextOrFail(filePath: string, label: string, fail: FailFn): string | null;
/**
 * Recursively collects markdown files under a directory.
 *
 * @param root - Directory to walk.
 * @param label - Human name used in messages.
 * @param fail - Failure reporter.
 * @returns Sorted list of absolute markdown paths.
 */
export declare function walkMarkdown(root: string, label: string, fail?: FailFn): string[];
/**
 * Lists skill directories under a skills root.
 *
 * @param skillsDir - Directory containing one folder per skill.
 * @param fail - Failure reporter.
 * @returns Sorted skill directory names.
 */
export declare function readSkillFolders(skillsDir: string, fail: FailFn): string[];
//# sourceMappingURL=io.d.ts.map