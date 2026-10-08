import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { evaluateTarget } from '../benchmark/evaluate.js';
import { runFullBenchmark } from '../benchmark/run-benchmark.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const TICKETS_FILE = path.join(REPO_ROOT, 'benchmark', 'tickets', 'tickets.json');
const EVALUATE_BIN = path.join(REPO_ROOT, 'benchmark', 'evaluate.js');

let tmpDir: string;

function setUpTmp(): void {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-benchmark-test-'));
}

function tearDownTmp(): void {
  if (tmpDir && fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

describe('Track 4: Drift-Reduction Benchmark - Ticket Specification', () => {
  test('tickets.json defines 10 sequential tickets with expected IDs', () => {
    const raw = fs.readFileSync(TICKETS_FILE, 'utf-8');
    const tickets = JSON.parse(raw);

    assert.ok(Array.isArray(tickets));
    assert.strictEqual(tickets.length, 10);
    for (let i = 0; i < 10; i++) {
      const expectedId = `T${String(i + 1).padStart(2, '0')}`;
      assert.strictEqual(tickets[i].id, expectedId);
      assert.ok(tickets[i].title);
      assert.ok(tickets[i].description);
      assert.ok(Array.isArray(tickets[i].acceptance));
      assert.ok(tickets[i].acceptance.length >= 2);
    }
  });

  test('tickets.json contains exactly the 3 architectural traps', () => {
    const tickets = JSON.parse(fs.readFileSync(TICKETS_FILE, 'utf-8'));
    const traps = tickets.filter((t: any) => t.isTrap);

    assert.strictEqual(traps.length, 3);
    assert.strictEqual(traps[0].id, 'T03');
    assert.strictEqual(traps[0].trapType, 'file_bloat');
    assert.strictEqual(traps[1].id, 'T05');
    assert.strictEqual(traps[1].trapType, 'dependency_cycle');
    assert.strictEqual(traps[2].id, 'T07');
    assert.strictEqual(traps[2].trapType, 'boundary_breach');
  });
});

describe('Track 4: Drift-Reduction Benchmark - Automated Evaluator', () => {
  beforeEach(setUpTmp);
  afterEach(tearDownTmp);

  test('evaluates clean workspace with 0 violations and passed=true', async () => {
    const score = await evaluateTarget(path.join(REPO_ROOT, 'src'));

    assert.strictEqual(score.passed, true);
    assert.strictEqual(score.oversizedFileCount, 0);
    assert.strictEqual(score.dependencyCyclesCount, 0);
    assert.strictEqual(score.boundaryViolationsCount, 0);
    assert.ok(score.moduleCount > 0);
  });

  test('detects files exceeding 300 lines limit', async () => {
    const bigFile = path.join(tmpDir, 'bloated.ts');
    const lines = Array.from({ length: 305 }, (_, i) => `export const x${i} = ${i};`).join('\n');
    fs.writeFileSync(bigFile, lines, 'utf-8');

    const score = await evaluateTarget(tmpDir);

    assert.strictEqual(score.passed, false);
    assert.strictEqual(score.oversizedFileCount, 1);
    assert.strictEqual(score.oversizedFiles[0]?.file, 'bloated.ts');
    assert.strictEqual(score.oversizedFiles[0]?.lines, 305);
  });

  test('detects dependency cycles in target codebase', async () => {
    const fileA = path.join(tmpDir, 'a.ts');
    const fileB = path.join(tmpDir, 'b.ts');
    fs.writeFileSync(fileA, "import './b.js'; export const a = 1;");
    fs.writeFileSync(fileB, "import './a.js'; export const b = 2;");

    const score = await evaluateTarget(tmpDir);

    assert.strictEqual(score.passed, false);
    assert.strictEqual(score.dependencyCyclesCount, 1);
  });

  test('detects layer boundary violations in target codebase', async () => {
    const domainDir = path.join(tmpDir, 'domain');
    const infraDir = path.join(tmpDir, 'infrastructure');
    fs.mkdirSync(domainDir, { recursive: true });
    fs.mkdirSync(infraDir, { recursive: true });

    fs.writeFileSync(path.join(infraDir, 'db.ts'), 'export const db = {};');
    fs.writeFileSync(
      path.join(domainDir, 'order.ts'),
      "import '../infrastructure/db.js'; export const order = 1;"
    );

    const score = await evaluateTarget(tmpDir);

    assert.strictEqual(score.passed, false);
    assert.strictEqual(score.boundaryViolationsCount, 1);
    assert.strictEqual(score.boundaryViolations[0]?.from, 'domain');
    assert.strictEqual(score.boundaryViolations[0]?.to, 'infrastructure');
  });

  test('handles empty or nonexistent target safely', async () => {
    const missing = path.join(tmpDir, 'nonexistent');
    const score = await evaluateTarget(missing);

    assert.strictEqual(score.passed, true);
    assert.strictEqual(score.moduleCount, 0);
  });

  test('CLI evaluation process exits 0 on clean code and 1 on violations', () => {
    const cleanRun = spawnSync(process.execPath, [EVALUATE_BIN, path.join(REPO_ROOT, 'src')], {
      encoding: 'utf-8'
    });
    assert.strictEqual(cleanRun.status, 0);
    assert.ok(cleanRun.stdout.includes('DRIFT SCORE: 0 Violations'));

    const dirtyFile = path.join(tmpDir, 'large.ts');
    fs.writeFileSync(dirtyFile, Array.from({ length: 302 }, () => '// line').join('\n'));
    const dirtyRun = spawnSync(process.execPath, [EVALUATE_BIN, tmpDir], {
      encoding: 'utf-8'
    });
    assert.strictEqual(dirtyRun.status, 1);
    assert.ok(dirtyRun.stdout.includes('DRIFT DETECTED'));
  });

  test('runFullBenchmark proves Arm C achieves drift reduction over Arm A and B', async () => {
    const results = await runFullBenchmark();
    assert.strictEqual(results.armA.passed, false);
    assert.strictEqual(results.armA.oversizedFileCount, 1);
    assert.strictEqual(results.armB.passed, false);
    assert.strictEqual(results.armB.oversizedFileCount, 0);
    assert.strictEqual(results.armC.passed, true);
    assert.strictEqual(results.armC.dependencyCyclesCount, 0);
    assert.strictEqual(results.armC.boundaryViolationsCount, 0);
  });
});
