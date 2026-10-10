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
 * Canonical architectural boundary rules enforcing Hexagonal / Clean Architecture layer constraints.
 */
export declare const DEFAULT_BOUNDARY_RULES: readonly BoundaryRule[];
/**
 * Recursively discovers all eligible source files (.ts and .js) within a directory,
 * ignoring skipped directories (e.g. node_modules, lib) and test files.
 *
 * @param dir - Root directory to search.
 * @returns Sorted array of absolute file paths.
 */
export declare function findSourceFiles(dir: string): string[];
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
 * @param rules - Architectural boundary rules to enforce (defaults to DEFAULT_BOUNDARY_RULES).
 * @returns Array of detected boundary violations.
 */
export declare function detectBoundaryViolations(graph: Map<string, string[]>, rules?: readonly BoundaryRule[]): BoundaryViolation[];
/**
 * Inspects a source tree for architectural boundary violations and circular dependency cycles.
 *
 * @param sourceDir - Directory containing source code (e.g. src/).
 * @param rules - Architectural boundary rules.
 * @returns Report summarizing cycle and boundary findings.
 */
export declare function inspectBoundaries(sourceDir: string, rules?: readonly BoundaryRule[]): BoundaryReport;
declare const _default: {
    DEFAULT_BOUNDARY_RULES: readonly BoundaryRule[];
    findSourceFiles: typeof findSourceFiles;
    extractLocalImports: typeof extractLocalImports;
    buildDependencyGraph: typeof buildDependencyGraph;
    detectDependencyCycles: typeof detectDependencyCycles;
    detectBoundaryViolations: typeof detectBoundaryViolations;
    inspectBoundaries: typeof inspectBoundaries;
};
export default _default;
//# sourceMappingURL=boundaries.d.ts.map