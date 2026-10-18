/**
 * Loads layer rules from harness.yaml. Falls back to empty rules on error.
 */
declare function declaredLayerRules(sourceDir: string): BoundaryRule[];
declare function loadLayerRules(sourceDir: string): Promise<BoundaryRule[]>;
/**
 * Defines an architectural layer boundary rule disallowing imports from foreign layers.
 */
export interface BoundaryRule {
    /** Name of the architectural layer (e.g., 'domain', 'core'). */
    fromLayer: string;
    /** Array of layer names that fromLayer is forbidden from importing. */
    disallowImportsFrom: readonly string[];
}
/**
 * Represents an architectural boundary violation where a module imported a prohibited layer.
 */
export interface BoundaryViolation {
    /** Path of the file containing the illegal import. */
    file: string;
    /** Path of the imported file that violates the rule. */
    importedFile: string;
    /** Origin layer of the importing file. */
    fromLayer: string;
    /** Target layer that was forbidden to import. */
    toLayer: string;
}
/**
 * Report summarizing module count, detected circular cycles, and boundary violations.
 */
export interface BoundaryReport {
    /** Target directory inspected. */
    targetDir?: string;
    /** Total number of source modules scanned. */
    moduleCount: number;
    /** List of detected circular dependency cycles. */
    cycles: string[][];
    /** List of detected boundary violations. */
    violations: BoundaryViolation[];
    /** Whether the architecture is completely compliant (no cycles and no violations). */
    ok: boolean;
}
/**
 * Source-file discovery settings. With no extensions declared the scanner
 * reports zero modules rather than silently scanning only JavaScript.
 */
export interface ScanOptions {
    /** File extensions to treat as source. */
    extensions: readonly string[];
    /** Directory names to skip entirely. */
    skipDirs: readonly string[];
}
/**
 * Extensions scanned when a project declares no preference.
 *
 * The JavaScript-family default exists because the import graph extractor
 * understands ECMAScript module syntax. It is a limitation of the analyzer,
 * not a claim that other languages have no cycles.
 */
export declare const DEFAULT_SCAN_EXTENSIONS: readonly string[];
/**
 * Recursively discovers source files under a directory.
 *
 * @param dir - Root directory to search.
 * @param options - Extension and skip-directory settings.
 * @returns Sorted array of absolute file paths.
 */
export declare function findSourceFiles(dir: string, options?: ScanOptions): string[];
/**
 * Scans a source file and extracts all local relative import and export paths.
 *
 * @param filePath - Absolute or relative path to the source file.
 * @returns Sorted array of resolved local file paths imported or re-exported.
 */
export declare function extractLocalImports(filePath: string): string[];
/**
 * Constructs a dependency graph mapping each source file to its imported local files.
 *
 * @param files - Array of source file paths.
 * @returns Map where keys are source file paths and values are arrays of imported local file paths.
 */
export declare function buildDependencyGraph(files: readonly string[]): Map<string, string[]>;
/**
 * Analyzes a dependency graph using depth-first search to detect circular import cycles.
 *
 * @param graph - Map of file paths to their imported dependency file paths.
 * @returns Array of cycle paths, where each cycle path is an array of file paths.
 */
export declare function detectDependencyCycles(graph: Map<string, string[]>): string[][];
/**
 * Evaluates a dependency graph against architectural boundary rules to detect prohibited cross-layer imports.
 *
 * @param graph - Map of file paths to their imported dependency file paths.
 * @param rules - Architectural boundary rules to enforce.
 * @returns Array of detected boundary violations.
 */
export declare function detectBoundaryViolations(graph: Map<string, string[]>, rules?: readonly BoundaryRule[]): BoundaryViolation[];
/**
 * Inspects a source tree for architectural boundary violations and circular dependency cycles.
 *
 * @param sourceDir - Directory containing source code (e.g. src/).
 * @param rules - Architectural boundary rules.
 * @param options - Source discovery settings.
 * @returns Report summarizing cycle and boundary findings.
 */
export declare function inspectBoundaries(sourceDir: string, rules?: readonly BoundaryRule[], options?: ScanOptions): BoundaryReport;
/**
 * Async variant that auto-loads layer rules from harness.yaml.
 * Used by async callers (e.g., boundary guard script).
 */
export declare function inspectBoundariesAsync(sourceDir: string, rules?: readonly BoundaryRule[], options?: ScanOptions): Promise<BoundaryReport>;
export { loadLayerRules, declaredLayerRules };
declare const _default: {
    DEFAULT_SCAN_EXTENSIONS: readonly string[];
    findSourceFiles: typeof findSourceFiles;
    extractLocalImports: typeof extractLocalImports;
    buildDependencyGraph: typeof buildDependencyGraph;
    detectDependencyCycles: typeof detectDependencyCycles;
    detectBoundaryViolations: typeof detectBoundaryViolations;
    inspectBoundaries: typeof inspectBoundaries;
    inspectBoundariesAsync: typeof inspectBoundariesAsync;
};
export default _default;
//# sourceMappingURL=boundaries.d.ts.map