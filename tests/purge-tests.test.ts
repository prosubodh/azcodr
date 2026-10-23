import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { isAzcodrTestFile, purgeAzcodrTests } from '../src/purge-tests.js';

describe('Azcodr test purger', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-purge-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('isAzcodrTestFile identifies azcodr tests by name pattern', () => {
    const dummyPath = path.join(tmpDir, 'test.ts');
    fs.writeFileSync(dummyPath, '// empty test', 'utf-8');

    assert.strictEqual(isAzcodrTestFile('architecture.test.ts', dummyPath), true);
    assert.strictEqual(isAzcodrTestFile('agent-guard.test.ts', dummyPath), true);
    assert.strictEqual(isAzcodrTestFile('validate-links.test.ts', dummyPath), true);
    assert.strictEqual(isAzcodrTestFile('scaffold-git.test.ts', dummyPath), true);
    assert.strictEqual(isAzcodrTestFile('harness-resolve.test.ts', dummyPath), true);
  });

  test('isAzcodrTestFile identifies azcodr tests by marker in file content', () => {
    const azcodrContentPath = path.join(tmpDir, 'custom-name.test.ts');
    fs.writeFileSync(azcodrContentPath, 'import { inspectCommand } from "../src/agent-guard.js";\n', 'utf-8');
    assert.strictEqual(isAzcodrTestFile('custom-name.test.ts', azcodrContentPath), true);

    const domainContentPath = path.join(tmpDir, 'user.test.ts');
    fs.writeFileSync(domainContentPath, 'import { User } from "./user.js";\ndescribe("User domain", () => {});\n', 'utf-8');
    assert.strictEqual(isAzcodrTestFile('user.test.ts', domainContentPath), false);
  });

  test('isAzcodrTestFile rejects non-test files', () => {
    const docPath = path.join(tmpDir, 'README.md');
    fs.writeFileSync(docPath, 'azcodr docs', 'utf-8');
    assert.strictEqual(isAzcodrTestFile('README.md', docPath), false);
  });

  test('purgeAzcodrTests returns empty array when tests directory does not exist', () => {
    const actions = purgeAzcodrTests(tmpDir);
    assert.deepStrictEqual(actions, []);
  });

  test('purgeAzcodrTests removes azcodr tests while preserving domain tests and subdirectories', () => {
    const testsDir = path.join(tmpDir, 'tests');
    fs.mkdirSync(testsDir, { recursive: true });

    const azcodrTest1 = path.join(testsDir, 'architecture.test.ts');
    fs.writeFileSync(azcodrTest1, 'import * as rt from "../src/index.js";\n', 'utf-8');

    const azcodrTest2 = path.join(testsDir, 'agent-guard.test.ts');
    fs.writeFileSync(azcodrTest2, 'import { inspectPreTool } from "../lib/agent-guard.js";\n', 'utf-8');

    const supportDir = path.join(testsDir, 'support');
    fs.mkdirSync(supportDir, { recursive: true });
    fs.writeFileSync(path.join(supportDir, 'helper.ts'), 'export const x = 1;', 'utf-8');

    const domainTest = path.join(testsDir, 'user.test.ts');
    const domainContent = 'describe("User service", () => { it("works", () => {}); });\n';
    fs.writeFileSync(domainTest, domainContent, 'utf-8');

    const unitSubdir = path.join(testsDir, 'unit');
    fs.mkdirSync(unitSubdir, { recursive: true });
    fs.writeFileSync(path.join(unitSubdir, 'order.test.ts'), 'describe("Order", () => {});\n', 'utf-8');

    const actions = purgeAzcodrTests(tmpDir);

    assert.ok(actions.some((a) => a.includes('remove: tests/architecture.test.ts')));
    assert.ok(actions.some((a) => a.includes('remove: tests/agent-guard.test.ts')));
    assert.ok(actions.some((a) => a.includes('remove: tests/support')));

    assert.strictEqual(fs.existsSync(azcodrTest1), false);
    assert.strictEqual(fs.existsSync(azcodrTest2), false);
    assert.strictEqual(fs.existsSync(supportDir), false);

    assert.strictEqual(fs.existsSync(domainTest), true);
    assert.strictEqual(fs.readFileSync(domainTest, 'utf-8'), domainContent);
    assert.strictEqual(fs.existsSync(path.join(unitSubdir, 'order.test.ts')), true);
  });

  test('purgeAzcodrTests honors dryRun without deleting files', () => {
    const testsDir = path.join(tmpDir, 'tests');
    fs.mkdirSync(testsDir, { recursive: true });
    const azcodrTest = path.join(testsDir, 'architecture.test.ts');
    fs.writeFileSync(azcodrTest, '// test', 'utf-8');

    const actions = purgeAzcodrTests(tmpDir, true);
    assert.ok(actions.some((a) => a.includes('remove: tests/architecture.test.ts')));
    assert.strictEqual(fs.existsSync(azcodrTest), true);
  });
});
