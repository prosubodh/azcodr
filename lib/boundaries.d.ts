export interface BoundaryRule {
    fromLayer: string;
    disallowImportsFrom: readonly string[];
}
export interface BoundaryViolation {
    file: string;
    importedFile: string;
    fromLayer: string;
    toLayer: string;
}
export interface BoundaryReport {
    moduleCount: number;
    cycles: string[][];
    violations: BoundaryViolation[];
    ok: boolean;
}
export declare const DEFAULT_BOUNDARY_RULES: readonly BoundaryRule[];
export declare function findSourceFiles(dir: string): string[];
export declare function extractLocalImports(filePath: string): string[];
export declare function buildDependencyGraph(files: readonly string[]): Map<string, string[]>;
export declare function detectDependencyCycles(graph: Map<string, string[]>): string[][];
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