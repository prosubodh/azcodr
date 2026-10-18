import type { AppliesWhen, HarnessConfig, ProjectFacts, Severity } from './harness-config.js';
/**
 * A check id together with everything needed to decide whether it runs.
 */
export interface ResolvedCheck {
    /** The check identifier. */
    id: string;
    /** Whether the check is active for this project. */
    enabled: boolean;
    /** Effective enforcement level. */
    severity: Severity;
    /** True when the check is a non-removable safety invariant. */
    core: boolean;
    /** True when configuration attempted to disable a core check. */
    overridden: boolean;
    /** Why the check resolved the way it did. */
    reason: string;
    /** Which condition produced the decision. */
    matchedBy: string;
    /** Free-form parameters handed to the checker. */
    params: Record<string, unknown>;
    /** Layer rules for `layer-boundaries`; empty means the check cannot report. */
    layers: Record<string, string[]>;
    /** Conditional gating that produced the decision. */
    applies: AppliesWhen;
    /** Decides whether a specific file is in scope. */
    enabledFor: (filePath: string) => boolean;
}
/**
 * Matches a repo-relative path against a single glob pattern.
 *
 * @param filePath - Path relative to the repository root.
 * @param pattern - Glob supporting `*`, `**` and `?`.
 * @returns True when the path matches.
 */
export declare function matchGlob(filePath: string, pattern: string): boolean;
/**
 * Matches a path against any pattern in a list.
 *
 * @param filePath - Path relative to the repository root.
 * @param patterns - Glob patterns to test.
 * @returns True when at least one pattern matches.
 */
export declare function matchesAny(filePath: string, patterns: readonly string[]): boolean;
/**
 * Resolves every known check against declared project facts.
 *
 * Checks absent from the configuration resolve to disabled rather than absent,
 * so `explain` can always report a verdict. A malformed rule set disables the
 * offending check and records why; it never blocks a project on a parser quirk.
 *
 * @param config - The loaded configuration.
 * @param facts - Project facts used to evaluate conditional gates.
 * @returns A map of check id to its resolution.
 */
export declare function resolveChecks(config: HarnessConfig, facts: ProjectFacts): Map<string, ResolvedCheck>;
/**
 * Renders a human-readable explanation of one check's resolution.
 *
 * @param report - A map produced by resolveChecks.
 * @param id - Check identifier to explain.
 * @returns Multi-line explanation suitable for terminal output.
 */
export declare function explainCheck(report: Map<string, ResolvedCheck>, id: string): string;
declare const _default: {
    resolveChecks: typeof resolveChecks;
    explainCheck: typeof explainCheck;
    matchGlob: typeof matchGlob;
    matchesAny: typeof matchesAny;
};
export default _default;
//# sourceMappingURL=harness-resolve.d.ts.map