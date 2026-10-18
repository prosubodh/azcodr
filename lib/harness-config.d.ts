/**
 * Config file names searched, in order, at a workspace root.
 */
export declare const CONFIG_FILE_NAMES: readonly string[];
/** Schema version understood by this release. */
export declare const SUPPORTED_VERSION = 1;
/**
 * Checks that are always active and cannot be switched off by configuration.
 * These are destructive-action safety invariants, not methodology.
 */
export declare const CORE_CHECK_IDS: readonly string[];
/**
 * Optional checks a project may declare. None are enabled by default; each is
 * methodology or tooling policy that a dissenting project simply omits.
 */
export declare const OPTIONAL_CHECK_IDS: readonly string[];
/**
 * Every check id the resolver can produce a verdict for.
 */
export declare const KNOWN_CHECK_IDS: readonly string[];
/** Valid severity levels, ordered from most to least consequential. */
export type Severity = 'error' | 'warn' | 'off';
/** Methodology presets. `none` means the project declared no test discipline. */
export type Methodology = 'none' | 'tdd' | 'bdd' | 'contract-first' | 'property-based' | 'custom';
/**
 * Conditional gating applied before a check is considered active.
 */
export interface AppliesWhen {
    /** Glob(s) the check applies to; empty means every file. */
    paths: string[];
    /** Glob(s) exempted from the check. */
    exclude: string[];
    /** Project languages the check applies to; empty means every language. */
    languages: string[];
    /** Paths that must exist for the check to apply. */
    has: string[];
    /** Restrict evaluation to files changed in the working tree. */
    changed_only: boolean;
}
/**
 * A single declared check.
 */
export interface CheckDeclaration {
    /** Stable check identifier resolved by the checker registry. */
    id: string;
    /** Explicit opt-in flag; defaults to true when the check is declared. */
    enabled: boolean;
    /** Enforcement level. */
    severity: Severity;
    /** Free-form parameters handed to the checker. */
    params: Record<string, unknown>;
    /** Conditional gating. */
    applies_when: AppliesWhen;
    /** Layer rules for `layer-boundaries`, as a map of layer name to forbidden layers. */
    layers: Record<string, string[]> | null;
}
/**
 * Project facts the harness needs in order to decide anything.
 */
export interface ProjectFacts {
    /** Declared languages. */
    languages: string[];
    /** Verified commands keyed by purpose (build, test, lint, typecheck). */
    commands: Record<string, string[]>;
    /** Repository root used to resolve `has` conditions. */
    root?: string;
    /** Files changed in the working tree, for `changed_only`. */
    changed?: readonly string[];
}
/**
 * A fully resolved, validated harness configuration.
 */
export interface HarnessConfig {
    /** Schema version. */
    version: number;
    /** Declared project facts. */
    project: ProjectFacts;
    /** Chosen methodology preset. */
    methodology: Methodology;
    /** Installed pack identifiers. */
    packs: string[];
    /** Declared checks. */
    checks: CheckDeclaration[];
    /** Name of the file this config was loaded from, or null for the default. */
    source: string | null;
}
/**
 * Error raised when a configuration file exists but cannot be used.
 */
export declare class HarnessConfigError extends Error {
    /** 1-based line number of the offending content, or 0 when not line-specific. */
    readonly line: number;
    constructor(message: string, line?: number);
}
/**
 * Returns a configuration that declares nothing, so an unconfigured project
 * enables no optional check at all.
 */
export declare function defaultConfig(): HarnessConfig;
/**
 * Validates an already-parsed document into a typed configuration.
 *
 * @param source - Raw `harness.yaml` text.
 * @returns The validated configuration.
 * @throws {HarnessConfigError} When any field is missing or malformed.
 */
export declare function parseHarnessConfig(source: string): HarnessConfig;
/**
 * Locates and loads the configuration for a workspace root.
 *
 * A workspace with no configuration file is not an error: it yields the
 * neutral default, which declares no optional checks.
 *
 * @param root - Workspace directory to search.
 * @returns The loaded configuration, or the neutral default when none exists.
 * @throws {HarnessConfigError} When a config file exists but is unusable.
 */
export declare function loadHarnessConfig(root: string): HarnessConfig;
declare const _default: {
    loadHarnessConfig: typeof loadHarnessConfig;
    parseHarnessConfig: typeof parseHarnessConfig;
    defaultConfig: typeof defaultConfig;
    HarnessConfigError: typeof HarnessConfigError;
};
export default _default;
//# sourceMappingURL=harness-config.d.ts.map