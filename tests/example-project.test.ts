import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { inspectBoundaries, DEFAULT_BOUNDARY_RULES } from '../src/boundaries.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EXAMPLE_DIR = path.join(ROOT, 'examples', 'clean-architecture-todo');
const EXAMPLE_SRC = path.join(EXAMPLE_DIR, 'src');

describe('Example Project Architecture Governance (Phase 1)', () => {
  test('example project adheres to Clean Architecture with zero cycles or layer breaches', () => {
    assert.ok(fs.existsSync(EXAMPLE_SRC), 'example src directory must exist');
    const report = inspectBoundaries(EXAMPLE_SRC, DEFAULT_BOUNDARY_RULES);

    assert.strictEqual(report.ok, true, 'example architecture must be 100% compliant');
    assert.strictEqual(report.cycles.length, 0, 'must have zero circular dependency cycles');
    assert.strictEqual(report.violations.length, 0, 'must have zero layer boundary violations');
    assert.ok(report.moduleCount >= 5, 'must evaluate all domain, port, use case and adapter modules');
  });

  test('every file in example project is under 300 lines (Clean Code fitness function)', () => {
    const stack = [EXAMPLE_SRC];
    while (stack.length > 0) {
      const current = stack.pop()!;
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(full);
        } else if (entry.name.endsWith('.js') || entry.name.endsWith('.ts')) {
          const lines = fs.readFileSync(full, 'utf-8').split('\n').length;
          assert.ok(
            lines <= 300,
            `${path.relative(ROOT, full)} has ${lines} lines, exceeding 300 line limit`
          );
        }
      }
    }
  });
});
