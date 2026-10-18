import fs from 'node:fs';
import path from 'node:path';
import { loadHarnessConfig } from './harness-config.js';
import { resolveChecks } from './harness-resolve.js';
/**
 * Loads layer rules from harness.yaml. Falls back to empty rules on error.
 */
function declaredLayerRules(sourceDir) {
    try {
        const config = loadHarnessConfig(sourceDir);
        const report = resolveChecks(config, config.project);
        const layers = report.get('layer-boundaries').layers;
        return Object.entries(layers).map(([fromLayer, disallowed]) => ({
            fromLayer,
            disallowImportsFrom: disallowed
        }));
    }
    catch {
        return [];
    }
}
async function loadLayerRules(sourceDir) {
    return declaredLayerRules(sourceDir);
}
/**
 * Extensions scanned when a project declares no preference.
 *
 * The JavaScript-family default exists because the import graph extractor
 * understands ECMAScript module syntax. It is a limitation of the analyzer,
 * not a claim that other languages have no cycles.
 */
export const DEFAULT_SCAN_EXTENSIONS = ['.ts', '.js', '.mjs', '.tsx', '.jsx'];
function isSkippedDir(name, skipDirs) {
    return name.startsWith('.') || name === 'node_modules' || skipDirs.includes(name);
}
function isEligibleSource(name, extensions) {
    const ext = path.extname(name).toLowerCase();
    if (!extensions.includes(ext) || name.endsWith('.d.ts'))
        return false;
    return !name.includes('.test.') && !name.includes('.spec.');
}
/**
 * Recursively discovers source files under a directory.
 *
 * @param dir - Root directory to search.
 * @param options - Extension and skip-directory settings.
 * @returns Sorted array of absolute file paths.
 */
export function findSourceFiles(dir, options = {
    extensions: DEFAULT_SCAN_EXTENSIONS,
    skipDirs: ['lib', 'dist', 'build', 'target', 'vendor']
}) {
    if (!fs.existsSync(dir))
        return [];
    const results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (isSkippedDir(entry.name, options.skipDirs))
            continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...findSourceFiles(full, options));
        }
        else if (isEligibleSource(entry.name, options.extensions)) {
            results.push(path.resolve(full));
        }
    }
    return results.sort();
}
function resolveImportTarget(sourceFile, specifier) {
    const dir = path.dirname(sourceFile);
    const candidate = path.resolve(dir, specifier);
    if (fs.existsSync(candidate))
        return candidate;
    if (specifier.endsWith('.js')) {
        const tsCandidate = path.resolve(dir, specifier.slice(0, -3) + '.ts');
        if (fs.existsSync(tsCandidate))
            return tsCandidate;
    }
    return null;
}
/**
 * Scans a source file and extracts all local relative import and export paths.
 *
 * @param filePath - Absolute or relative path to the source file.
 * @returns Sorted array of resolved local file paths imported or re-exported.
 */
export function extractLocalImports(filePath) {
    if (!fs.existsSync(filePath))
        return [];
    const content = fs.readFileSync(filePath, 'utf-8');
    const imports = [];
    const regex = /(?:import|export)\s+(?:(?:[\s\S]*?from\s+)|)['"](\.[^'"]+)['"]|import\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g;
    for (const match of content.matchAll(regex)) {
        const spec = (match[1] ?? match[2]);
        const resolved = resolveImportTarget(filePath, spec);
        if (resolved && !imports.includes(resolved)) {
            imports.push(resolved);
        }
    }
    return imports.sort();
}
/**
 * Constructs a dependency graph mapping each source file to its imported local files.
 *
 * @param files - Array of source file paths.
 * @returns Map where keys are source file paths and values are arrays of imported local file paths.
 */
export function buildDependencyGraph(files) {
    const graph = new Map();
    for (const file of files) {
        graph.set(file, extractLocalImports(file));
    }
    return graph;
}
/**
 * Analyzes a dependency graph using depth-first search to detect circular import cycles.
 *
 * @param graph - Map of file paths to their imported dependency file paths.
 * @returns Array of cycle paths, where each cycle path is an array of file paths.
 */
export function detectDependencyCycles(graph) {
    const cycles = [];
    const visited = new Set();
    const inStack = new Set();
    const pathStack = [];
    function dfs(node) {
        visited.add(node);
        inStack.add(node);
        pathStack.push(node);
        for (const neighbor of graph.get(node) ?? []) {
            if (!visited.has(neighbor)) {
                dfs(neighbor);
            }
            else if (inStack.has(neighbor)) {
                const startIdx = pathStack.indexOf(neighbor);
                cycles.push([...pathStack.slice(startIdx), neighbor]);
            }
        }
        inStack.delete(node);
        pathStack.pop();
    }
    for (const node of graph.keys()) {
        if (!visited.has(node))
            dfs(node);
    }
    return cycles;
}
function hasLayerSegment(pathStr, segment) {
    return new RegExp(`(^|[/\\\\])${segment}([/\\\\]|$)`, 'i').test(pathStr);
}
/**
 * Evaluates a dependency graph against architectural boundary rules to detect prohibited cross-layer imports.
 *
 * @param graph - Map of file paths to their imported dependency file paths.
 * @param rules - Architectural boundary rules to enforce.
 * @returns Array of detected boundary violations.
 */
export function detectBoundaryViolations(graph, rules = []) {
    const violations = [];
    for (const [file, imports] of graph.entries()) {
        for (const rule of rules) {
            if (hasLayerSegment(file, rule.fromLayer)) {
                for (const imported of imports) {
                    for (const disallowed of rule.disallowImportsFrom) {
                        if (hasLayerSegment(imported, disallowed)) {
                            violations.push({
                                file,
                                importedFile: imported,
                                fromLayer: rule.fromLayer,
                                toLayer: disallowed
                            });
                        }
                    }
                }
            }
        }
    }
    return violations;
}
/**
 * Inspects a source tree for architectural boundary violations and circular dependency cycles.
 *
 * @param sourceDir - Directory containing source code (e.g. src/).
 * @param rules - Architectural boundary rules.
 * @param options - Source discovery settings.
 * @returns Report summarizing cycle and boundary findings.
 */
export function inspectBoundaries(sourceDir, rules, options) {
    // Synchronous path: use sync rule loader (for CLI and tests).
    const effectiveRules = rules ?? declaredLayerRules(sourceDir);
    const files = findSourceFiles(sourceDir, options);
    const graph = buildDependencyGraph(files);
    const cycles = detectDependencyCycles(graph);
    const violations = detectBoundaryViolations(graph, effectiveRules);
    return {
        targetDir: sourceDir,
        moduleCount: files.length,
        cycles,
        violations,
        ok: files.length > 0 && cycles.length === 0 && violations.length === 0
    };
}
/**
 * Async variant that auto-loads layer rules from harness.yaml.
 * Used by async callers (e.g., boundary guard script).
 */
export async function inspectBoundariesAsync(sourceDir, rules, options) {
    return inspectBoundaries(sourceDir, rules, options);
}
export { loadLayerRules, declaredLayerRules };
export default {
    DEFAULT_SCAN_EXTENSIONS, findSourceFiles, extractLocalImports, buildDependencyGraph,
    detectDependencyCycles, detectBoundaryViolations, inspectBoundaries, inspectBoundariesAsync
};
//# sourceMappingURL=boundaries.js.map