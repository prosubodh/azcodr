import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { inspectFileWrite, countLines } from '../src/agent-guard-file.js';
import {
  isProductionFile,
  isTestFile,
  isNonCodeFile,
  inspectTddRequirement
} from '../src/agent-guard-tdd.js';
import type { PathMatcher } from '../src/agent-guard-tdd.js';

describe('file line budget is opt-in', () => {
  test('a file of any size is allowed when no limit is configured', () => {
    const r = inspectFileWrite({ filePath: 'x.ts', incomingContent: 'a\n'.repeat(5000) });
    assert.strictEqual(r.blocked, false);
    assert.strictEqual(r.maxLines, null);
    assert.match(r.reason ?? '', /no line budget/i);
  });

  test('a configured limit blocks an oversized new file', () => {
    const r = inspectFileWrite({ filePath: 'x.ts', incomingContent: 'a\n'.repeat(400), maxLines: 300 });
    assert.strictEqual(r.blocked, true);
    assert.match(r.reason ?? '', /300/);
  });

  test('an already-overflowing file may still shrink', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-lines-'));
    const file = path.join(dir, 'big.ts');
    fs.writeFileSync(file, 'x\n'.repeat(400), 'utf-8');
    const r = inspectFileWrite({ filePath: file, replacementContent: 'y\n', targetContent: 'x\nx\n', maxLines: 300 });
    assert.strictEqual(r.blocked, false);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('a file at exactly the limit is still writable', () => {
    const r = inspectFileWrite({ filePath: 'x.ts', incomingContent: 'a\n'.repeat(299), maxLines: 300 });
    assert.strictEqual(r.blocked, false);
  });

  test('excludePaths lets a project exempt generated or vendored files', () => {
    const r = inspectFileWrite({
      filePath: 'src/generated/api.ts',
      incomingContent: 'a\n'.repeat(900),
      maxLines: 300,
      excludePaths: ['src/generated/**']
    });
    assert.strictEqual(r.blocked, false);
    assert.match(r.reason ?? '', /excluded/i);
  });

  test('countLines treats a trailing newline as a terminator, not a new line', () => {
    assert.strictEqual(countLines('a\nb\n'), 2);
    assert.strictEqual(countLines('a\nb'), 2);
    assert.strictEqual(countLines(''), 0);
  });
});

describe('production-path detection is configured, not guessed', () => {
  const noRules: PathMatcher = { productionPaths: [], testPaths: [], nonCodeExtensions: [] };

  test('with no configured production paths nothing is production code', () => {
    assert.strictEqual(isProductionFile('src/auth.ts', noRules), false);
  });

  test('configured production globs are honoured', () => {
    const rules: PathMatcher = { ...noRules, productionPaths: ['src/**', 'internal/**'] };
    assert.strictEqual(isProductionFile('src/auth.ts', rules), true);
    assert.strictEqual(isProductionFile('internal/billing.go', rules), true);
    assert.strictEqual(isProductionFile('tests/auth_test.go', rules), false);
  });

  test('a segment match does not fire on a substring inside another segment', () => {
    const rules: PathMatcher = { ...noRules, productionPaths: ['app/**'] };
    assert.strictEqual(isProductionFile('myapp/models.py', rules), false);
    assert.strictEqual(isProductionFile('app/models.py', rules), true);
  });

  test('configured test globs cover BDD step definitions', () => {
    const rules: PathMatcher = {
      productionPaths: ['src/**'],
      testPaths: ['features/**', 'features/stepdefinitions/**', 'tests/**'],
      nonCodeExtensions: []
    };
    assert.strictEqual(isProductionFile('features/stepdefinitions/billing_steps.rb', rules), false);
  });

  test('built-in test detection still recognises conventional layouts', () => {
    assert.strictEqual(isTestFile('src/auth.test.ts'), true);
    assert.strictEqual(isTestFile('tests/test_billing.py'), true);
    assert.strictEqual(isTestFile('src/auth.ts'), false);
  });

  test('built-in non-code detection recognises data and config files', () => {
    assert.strictEqual(isNonCodeFile('README.md'), true);
    assert.strictEqual(isNonCodeFile('data/seed.json'), true);
    assert.strictEqual(isNonCodeFile('src/auth.ts'), false);
  });

  test('a notebook is never production code', () => {
    const rules: PathMatcher = { productionPaths: ['**'], testPaths: [], nonCodeExtensions: [] };
    assert.strictEqual(isProductionFile('analysis/exploration.ipynb', rules), false);
  });
});

describe('RED-before-GREEN is opt-in and fails open', () => {
  const state = { lastFailingTestRecorded: false };

  test('no enforcement means no block', () => {
    const r = inspectTddRequirement('src/auth.ts', state, { enforceTestFirst: false });
    assert.strictEqual(r.blocked, false);
  });

  test('enforcement without configured production paths cannot block anything', () => {
    const r = inspectTddRequirement('src/auth.ts', state, { enforceTestFirst: true });
    assert.strictEqual(r.blocked, false);
    assert.match(r.reason ?? '', /no production paths/i);
  });

  test('enforcement blocks production edits with no recorded failing test', () => {
    const r = inspectTddRequirement('src/auth.ts', state, {
      enforceTestFirst: true,
      productionPaths: ['src/**']
    });
    assert.strictEqual(r.blocked, true);
    assert.strictEqual(r.isProductionFile, true);
  });

  test('enforcement allows the edit once a failing test is recorded', () => {
    const r = inspectTddRequirement('src/auth.ts', { lastFailingTestRecorded: true }, {
      enforceTestFirst: true,
      productionPaths: ['src/**']
    });
    assert.strictEqual(r.blocked, false);
  });
});
