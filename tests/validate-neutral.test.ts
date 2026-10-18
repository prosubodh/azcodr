import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runValidation } from '../src/validator/run.js';

let tmpDir: string;
beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-neutral-'));
});
afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

/**
 * Creates a plain repository that uses no part of this harness.
 */
function plainRepo(): string {
  fs.writeFileSync(path.join(tmpDir, 'main.go'), 'package main\n\nfunc main() {}\n');
  fs.mkdirSync(path.join(tmpDir, 'internal'), { recursive: true });
  fs.writeFileSync(path.join(tmpDir, 'internal', 'billing.go'), 'package internal\n');
  return tmpDir;
}

function collect(): { logs: string[]; result: ReturnType<typeof runValidation> } {
  const logs: string[] = [];
  const result = runValidation(tmpDir, {
    pass: (m: string) => logs.push(`PASS ${m}`),
    warn: (m: string) => logs.push(`WARN ${m}`),
    fail: (m: string) => logs.push(`FAIL ${m}`),
    skip: (m: string) => logs.push(`SKIP ${m}`),
    log: (m: string) => logs.push(m),
    heading: (m: string) => logs.push(m)
  });
  return { logs, result };
}

describe('the validator is neutral about projects that do not use it', () => {
  test('a plain Go repository produces no errors', () => {
    const { result } = collect();
    assert.strictEqual(result.errors, 0, 'an unconfigured repo must not fail validation');
  });

  test('missing AGENTS.md is skipped, not failed', () => {
    plainRepo();
    const { logs, result } = collect();
    assert.strictEqual(result.errors, 0);
    assert.ok(logs.some((l) => /SKIP/i.test(l)), 'absence should be reported as a skip');
    assert.ok(!logs.some((l) => /^FAIL .*AGENTS/i.test(l)), 'must not fail on a missing AGENTS.md');
  });

  test('missing docs/rules is skipped, not failed', () => {
    plainRepo();
    const { logs } = collect();
    assert.ok(!logs.some((l) => /^FAIL .*rules/i.test(l)));
  });

  test('missing skills directory is skipped, not failed', () => {
    plainRepo();
    const { logs } = collect();
    assert.ok(!logs.some((l) => /^FAIL .*skills/i.test(l)));
  });

  test('missing memory.md is skipped, not failed', () => {
    plainRepo();
    const { logs, result } = collect();
    assert.strictEqual(result.errors, 0);
    assert.ok(!logs.some((l) => /^FAIL .*memory/i.test(l)));
  });

  test('rule and skill counts reflect what is actually present, not a constant', () => {
    plainRepo();
    const { result } = collect();
    assert.strictEqual(result.validatedRules, 0);
    assert.strictEqual(result.validatedSkills, 0);
  });

  test('declaring rules in a workspace makes them validated', () => {
    fs.mkdirSync(path.join(tmpDir, 'docs', 'rules'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'docs', 'rules', 'testing.md'), '# Testing\n');
    const { result } = collect();
    assert.strictEqual(result.validatedRules, 1);
  });

  test('an existing AGENTS.md with content passes without parity files', () => {
    plainRepo();
    fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), '# Agents\n\nDo the thing.\n');
    const { result } = collect();
    assert.strictEqual(result.errors, 0);
  });

  test('an over-long AGENTS.md warns but does not fail', () => {
    plainRepo();
    const long = `# Agents\n\n${'line\n'.repeat(400)}`;
    fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), long);
    const { result } = collect();
    assert.strictEqual(result.errors, 0, 'document length is advisory, not a build failure');
  });

  test('a genuinely broken markdown link inside AGENTS.md still fails', () => {
    plainRepo();
    fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), '# Agents\n\nSee [missing](./nope.md)\n');
    const { result } = collect();
    assert.ok(result.errors > 0, 'broken links are a real defect and must fail');
  });
});
