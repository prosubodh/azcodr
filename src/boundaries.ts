import fs from 'node:fs';
import path from 'node:path';

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

export const DEFAULT_BOUNDARY_RULES: readonly BoundaryRule[] = [
  {
    fromLayer: 'domain',
    disallowImportsFrom: ['infrastructure', 'infra', 'adapters', 'cli', 'transport', 'controllers']
  },
  {
    fromLayer: 'core',
    disallowImportsFrom: ['infrastructure', 'infra', 'adapters', 'presentation', 'ui']
  }
];

function isSkippedDir(name: string): boolean {
  return name.startsWith('.') || name === 'node_modules' || name === 'lib';
}

function isEligibleSource(name: string): boolean {
  const isScript = name.endsWith('.ts') || name.endsWith('.js');
  if (!isScript || name.endsWith('.d.ts')) return false;
  return !name.includes('.test.') && !name.includes('.spec.');
}

export function findSourceFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (isSkippedDir(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findSourceFiles(full));
    } else if (isEligibleSource(entry.name)) {
      results.push(path.resolve(full));
    }
  }

  return results.sort();
}

function resolveImportTarget(sourceFile: string, specifier: string): string | null {
  const dir = path.dirname(sourceFile);
  const candidate = path.resolve(dir, specifier);
  if (fs.existsSync(candidate)) return candidate;

  if (specifier.endsWith('.js')) {
    const tsCandidate = path.resolve(dir, specifier.slice(0, -3) + '.ts');
    if (fs.existsSync(tsCandidate)) return tsCandidate;
  }
  return null;
}

export function extractLocalImports(filePath: string): string[] {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const imports: string[] = [];
  const regex = /(?:import|export)\s+(?:(?:[\s\S]*?from\s+)|)['"](\.[^'"]+)['"]|import\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g;

  for (const match of content.matchAll(regex)) {
    const spec = match[1] ?? match[2];
    if (spec) {
      const resolved = resolveImportTarget(filePath, spec);
      if (resolved && !imports.includes(resolved)) {
        imports.push(resolved);
      }
    }
  }

  return imports.sort();
}

export function buildDependencyGraph(files: readonly string[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  for (const file of files) {
    graph.set(file, extractLocalImports(file));
  }
  return graph;
}

export function detectDependencyCycles(graph: Map<string, string[]>): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const pathStack: string[] = [];

  function dfs(node: string): void {
    visited.add(node);
    inStack.add(node);
    pathStack.push(node);

    for (const neighbor of graph.get(node) ?? []) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      } else if (inStack.has(neighbor)) {
        const startIdx = pathStack.indexOf(neighbor);
        if (startIdx !== -1) {
          cycles.push([...pathStack.slice(startIdx), neighbor]);
        }
      }
    }

    inStack.delete(node);
    pathStack.pop();
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) dfs(node);
  }

  return cycles;
}

function hasLayerSegment(pathStr: string, segment: string): boolean {
  return new RegExp(`(^|[/\\\\])${segment}([/\\\\]|$)`, 'i').test(pathStr);
}

export function detectBoundaryViolations(
  graph: Map<string, string[]>,
  rules: readonly BoundaryRule[] = DEFAULT_BOUNDARY_RULES
): BoundaryViolation[] {
  const violations: BoundaryViolation[] = [];

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
 * @returns Report summarizing cycle and boundary findings.
 */
export function inspectBoundaries(
  sourceDir: string,
  rules: readonly BoundaryRule[] = DEFAULT_BOUNDARY_RULES
): BoundaryReport {
  const files = findSourceFiles(sourceDir);
  const graph = buildDependencyGraph(files);
  const cycles = detectDependencyCycles(graph);
  const violations = detectBoundaryViolations(graph, rules);

  return {
    moduleCount: files.length,
    cycles,
    violations,
    ok: cycles.length === 0 && violations.length === 0
  };
}

export default {
  DEFAULT_BOUNDARY_RULES,
  findSourceFiles,
  extractLocalImports,
  buildDependencyGraph,
  detectDependencyCycles,
  detectBoundaryViolations,
  inspectBoundaries
};
