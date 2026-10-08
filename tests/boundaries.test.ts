import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import {
  inspectBoundaries,
  detectDependencyCycles,
  detectBoundaryViolations,
  findSourceFiles,
  extractLocalImports,
  buildDependencyGraph,
  DEFAULT_BOUNDARY_RULES
} from '../src/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(REPO_ROOT, 'src');

let tmpDir: string;
function setUpTmp() {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-boundary-test-'));
}
function tearDownTmp() {
  if (tmpDir && fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

describe('Track 3: Boundary Enforcement - Cycle Detection', () => {
  test('returns empty array when dependency graph is acyclic (DAG)', () => {
    const graph = new Map<string, string[]>([
      ['a.ts', ['b.ts', 'c.ts']],
      ['b.ts', ['c.ts']],
      ['c.ts', []]
    ]);
    const cycles = detectDependencyCycles(graph);
    assert.deepStrictEqual(cycles, []);
  });

  test('detects two-node circular dependency cycles', () => {
    const graph = new Map<string, string[]>([
      ['a.ts', ['b.ts']],
      ['b.ts', ['a.ts']]
    ]);
    const cycles = detectDependencyCycles(graph);
    assert.strictEqual(cycles.length, 1);
    assert.deepStrictEqual(cycles[0], ['a.ts', 'b.ts', 'a.ts']);
  });

  test('detects multi-node circular dependency cycles', () => {
    const graph = new Map<string, string[]>([
      ['a.ts', ['b.ts']],
      ['b.ts', ['c.ts']],
      ['c.ts', ['a.ts']]
    ]);
    const cycles = detectDependencyCycles(graph);
    assert.strictEqual(cycles.length, 1);
    assert.deepStrictEqual(cycles[0], ['a.ts', 'b.ts', 'c.ts', 'a.ts']);
  });
});

describe('Track 3: Boundary Enforcement - Layer Boundary Rules', () => {
  test('flags when domain layer illegally imports infrastructure', () => {
    const graph = new Map<string, string[]>([
      ['src/domain/order.ts', ['src/infrastructure/postgres.ts']]
    ]);
    const violations = detectBoundaryViolations(graph, DEFAULT_BOUNDARY_RULES);
    assert.strictEqual(violations.length, 1);
    assert.strictEqual(violations[0]!.fromLayer, 'domain');
    assert.strictEqual(violations[0]!.toLayer, 'infrastructure');
  });

  test('flags when core layer illegally imports presentation or ui', () => {
    const graph = new Map<string, string[]>([
      ['src/core/auth.ts', ['src/presentation/login-view.ts']]
    ]);
    const violations = detectBoundaryViolations(graph, DEFAULT_BOUNDARY_RULES);
    assert.strictEqual(violations.length, 1);
    assert.strictEqual(violations[0]!.fromLayer, 'core');
    assert.strictEqual(violations[0]!.toLayer, 'presentation');
  });

  test('permits outside-in dependencies (infrastructure importing domain)', () => {
    const graph = new Map<string, string[]>([
      ['src/infrastructure/postgres.ts', ['src/domain/order.ts']]
    ]);
    const violations = detectBoundaryViolations(graph);
    assert.strictEqual(violations.length, 0);
  });

  test('detects cycles on graphs with undefined neighbor arrays', () => {
    const graph = new Map<string, any>([
      ['orphan.ts', undefined]
    ]);
    assert.deepStrictEqual(detectDependencyCycles(graph), []);
  });
});

describe('Track 3: Boundary Enforcement - File Scanning & Import Parsing', () => {
  beforeEach(setUpTmp);
  afterEach(tearDownTmp);

  test('findSourceFiles traverses directory and skips node_modules and d.ts', () => {
    const sub = path.join(tmpDir, 'pkg');
    fs.mkdirSync(sub, { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'node_modules', 'dep'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.git'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'lib'), { recursive: true });
    fs.writeFileSync(path.join(sub, 'a.ts'), 'export const a = 1;');
    fs.writeFileSync(path.join(sub, 'b.js'), 'export const b = 2;');
    fs.writeFileSync(path.join(sub, 'c.d.ts'), 'export declare const c: number;');
    fs.writeFileSync(path.join(sub, 'test.test.ts'), 'test()');

    const files = findSourceFiles(tmpDir);
    assert.strictEqual(files.length, 2);
    assert.ok(files[0]!.endsWith('a.ts'));
    assert.ok(files[1]!.endsWith('b.js'));
  });

  test('extractLocalImports parses static and dynamic relative imports', () => {
    const targetFile = path.join(tmpDir, 'target.ts');
    const importedFile = path.join(tmpDir, 'helper.ts');
    fs.writeFileSync(importedFile, 'export const x = 1;');
    fs.writeFileSync(targetFile, `
      import { x } from './helper.js';
      import * as all from './helper.ts';
      export { x } from './helper.js';
      const m = await import('./helper.js');
      import { missing } from './unresolvable.js';
    `);

    const imports = extractLocalImports(targetFile);
    assert.strictEqual(imports.length, 1);
    assert.strictEqual(imports[0], path.resolve(importedFile));
  });

  test('handles nonexistent files and directories safely', () => {
    assert.deepStrictEqual(findSourceFiles(path.join(tmpDir, 'missing')), []);
    assert.deepStrictEqual(extractLocalImports(path.join(tmpDir, 'missing.ts')), []);
    const emptyGraph = buildDependencyGraph([]);
    assert.strictEqual(emptyGraph.size, 0);
  });
});

describe('Track 3: Real Workspace Architectural Verification', () => {
  test('verifies azcodr src/ has 0 cycles and 0 boundary violations', () => {
    const report = inspectBoundaries(SRC_DIR);
    assert.strictEqual(report.ok, true);
    assert.strictEqual(report.cycles.length, 0, `Cycles found: ${JSON.stringify(report.cycles)}`);
    assert.strictEqual(report.violations.length, 0, `Violations found: ${JSON.stringify(report.violations)}`);
    assert.ok(report.moduleCount >= 10);
  });
});
