import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, test } from 'vitest';
import { parsePromptLedger, checkPromptLedger, inspectPromptCommit, pruneCompletedLedger } from '../src/prompt-ledger.js';

describe('prompt-ledger: parsing markdown checkbox items', () => {
  test('returns clean: true when markdown has no checkboxes', () => {
    const result = parsePromptLedger('# Ledger\n\nNo active items here.');
    assert.strictEqual(result.exists, true);
    assert.strictEqual(result.clean, true);
    assert.strictEqual(result.pendingCount, 0);
    assert.strictEqual(result.completedCount, 0);
    assert.deepStrictEqual(result.pendingDirectives, []);
    assert.deepStrictEqual(result.completedDirectives, []);
  });

  test('parses pending and completed checkbox items correctly', () => {
    const markdown = [
      '# Active Ledger',
      '- [ ] Implement user profile form',
      '- [x] Add validation schema',
      '- [X] Write unit tests for schema',
      '- [ ] Add verification email trigger'
    ].join('\n');

    const result = parsePromptLedger(markdown);
    assert.strictEqual(result.exists, true);
    assert.strictEqual(result.clean, false);
    assert.strictEqual(result.pendingCount, 2);
    assert.strictEqual(result.completedCount, 2);
    assert.deepStrictEqual(result.pendingDirectives, [
      { text: 'Implement user profile form', completed: false },
      { text: 'Add verification email trigger', completed: false }
    ]);
    assert.deepStrictEqual(result.completedDirectives, [
      { text: 'Add validation schema', completed: true },
      { text: 'Write unit tests for schema', completed: true }
    ]);
  });
});

describe('prompt-ledger: file reading and path resolution', () => {
  test('returns exists: false and clean: true when ledger file does not exist', () => {
    const result = checkPromptLedger('/non/existent/path');
    assert.strictEqual(result.exists, false);
    assert.strictEqual(result.clean, true);
    assert.strictEqual(result.pendingCount, 0);
  });

  test('reads and parses existing ledger file directly', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-ledger-test-'));
    const ledgerFile = path.join(tmpDir, 'pending.md');
    fs.writeFileSync(ledgerFile, '# Ledger\n- [ ] Unfinished task\n- [x] Finished task\n', 'utf-8');

    const result = checkPromptLedger(ledgerFile);
    assert.strictEqual(result.exists, true);
    assert.strictEqual(result.clean, false);
    assert.strictEqual(result.pendingCount, 1);
    assert.strictEqual(result.completedCount, 1);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('resolves directory to .agents/ledger/pending.md automatically', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-ledger-dir-'));
    const ledgerDir = path.join(tmpDir, '.agents', 'ledger');
    fs.mkdirSync(ledgerDir, { recursive: true });
    const ledgerFile = path.join(ledgerDir, 'pending.md');
    fs.writeFileSync(ledgerFile, '# Ledger\n- [x] All done\n', 'utf-8');

    const result = checkPromptLedger(tmpDir);
    assert.strictEqual(result.exists, true);
    assert.strictEqual(result.clean, true);
    assert.strictEqual(result.pendingCount, 0);
    assert.strictEqual(result.completedCount, 1);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

describe('prompt-ledger: inspectPromptCommit interception', () => {
  test('allows non-commit commands regardless of ledger state', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-ledger-guard-'));
    const ledgerDir = path.join(tmpDir, '.agents', 'ledger');
    fs.mkdirSync(ledgerDir, { recursive: true });
    fs.writeFileSync(path.join(ledgerDir, 'pending.md'), '- [ ] Open directive\n', 'utf-8');

    const result = inspectPromptCommit('git status', tmpDir);
    assert.strictEqual(result.blocked, false);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('blocks git commit commands when pending directives exist', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-ledger-guard-'));
    const ledgerDir = path.join(tmpDir, '.agents', 'ledger');
    fs.mkdirSync(ledgerDir, { recursive: true });
    fs.writeFileSync(
      path.join(ledgerDir, 'pending.md'),
      '# Active Ledger\n- [ ] Unfinished requirement\n- [x] Finished requirement\n',
      'utf-8'
    );

    const result = inspectPromptCommit('git commit -m "feat: wip"', tmpDir);
    assert.strictEqual(result.blocked, true);
    assert.match(result.reason ?? '', /Zero-Unattended-Prompt Invariant/);
    assert.match(result.reason ?? '', /Unfinished requirement/);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('allows git commit when all directives are completed', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-ledger-guard-'));
    const ledgerDir = path.join(tmpDir, '.agents', 'ledger');
    fs.mkdirSync(ledgerDir, { recursive: true });
    fs.writeFileSync(
      path.join(ledgerDir, 'pending.md'),
      '# Active Ledger\n- [x] All requirements satisfied\n',
      'utf-8'
    );

    const result = inspectPromptCommit('git commit -m "feat: complete"', tmpDir);
    assert.strictEqual(result.blocked, false);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('uses default process.cwd() when workspaceRoot is omitted', () => {
    // In workspace root, check if inspectPromptCommit runs cleanly or intercepts
    const result = inspectPromptCommit('git commit -m "feat: default root"');
    // If workspace has no .agents/ledger/pending.md, it should allow commit
    assert.strictEqual(typeof result.blocked, 'boolean');
  });
});

describe('prompt-ledger: pruneCompletedLedger', () => {
  test('returns deleted: false when no ledger exists at target', () => {
    const result = pruneCompletedLedger('/non/existent/path/for/sure');
    assert.strictEqual(result.deleted, false);
    assert.match(result.reason ?? '', /No prompt ledger found/);
  });

  test('refuses to delete ledger when pending directives exist', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-ledger-prune-'));
    const ledgerDir = path.join(tmpDir, '.agents', 'ledger');
    fs.mkdirSync(ledgerDir, { recursive: true });
    const ledgerFile = path.join(ledgerDir, 'pending.md');
    fs.writeFileSync(ledgerFile, '# Active Ledger\n- [ ] Unfinished task\n', 'utf-8');

    const result = pruneCompletedLedger(tmpDir);
    assert.strictEqual(result.deleted, false);
    assert.match(result.reason ?? '', /Cannot delete ledger: 1 directive\(s\) are still pending/);
    assert.ok(fs.existsSync(ledgerFile));

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('unlinks file and returns deleted: true when all directives are completed', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-ledger-prune-'));
    const ledgerDir = path.join(tmpDir, '.agents', 'ledger');
    fs.mkdirSync(ledgerDir, { recursive: true });
    const ledgerFile = path.join(ledgerDir, 'pending.md');
    fs.writeFileSync(ledgerFile, '# Active Ledger\n- [x] Task 1\n- [x] Task 2\n', 'utf-8');

    const result = pruneCompletedLedger(tmpDir);
    assert.strictEqual(result.deleted, true);
    assert.strictEqual(result.filePath, ledgerFile);
    assert.strictEqual(fs.existsSync(ledgerFile), false);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});




