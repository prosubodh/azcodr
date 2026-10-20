import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { parseArgs } from '../src/cli-parse.js';
import { handlePromptCommand } from '../src/cli-prompt.js';

describe('CLI Prompt Command (Prompt Ledger Integrity)', () => {
  describe('parseArgs recognition', () => {
    test('parses prompt subcommand', () => {
      const parsed = parseArgs(['prompt']);
      assert.strictEqual(parsed.command, 'prompt');
      assert.strictEqual(parsed.targetDir, null);
    });

    test('parses ledger alias with custom target directory', () => {
      const parsed = parseArgs(['ledger', './custom']);
      assert.strictEqual(parsed.command, 'prompt');
      assert.strictEqual(parsed.targetDir, './custom');
    });
  });

  describe('handlePromptCommand', () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-cliprompt-'));
    });

    afterEach(() => {
      if (tmpDir && fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    test('exits 0 when no ledger file exists in workspace', () => {
      const logs: string[] = [];
      let exitCode: number | null = null;

      const code = handlePromptCommand(
        { command: 'prompt', targetDir: null, force: false, noGit: false, dryRun: false, silent: false, terminal: null },
        {
          out: (m) => logs.push(m),
          err: (m) => logs.push(m),
          exit: (c) => { exitCode = c; return c; },
          cwd: tmpDir
        }
      );

      assert.strictEqual(code ?? exitCode, 0);
      assert.ok(logs.some((l) => l.includes('No prompt ledger found')));
    });

    test('exits 0 when all prompt directives in ledger are completed', () => {
      const ledgerDir = path.join(tmpDir, '.agents', 'ledger');
      fs.mkdirSync(ledgerDir, { recursive: true });
      fs.writeFileSync(path.join(ledgerDir, 'pending.md'), '# Ledger\n- [x] Done item\n', 'utf-8');

      const logs: string[] = [];
      let exitCode: number | null = null;

      const code = handlePromptCommand(
        { command: 'prompt', targetDir: null, force: false, noGit: false, dryRun: false, silent: false, terminal: null },
        {
          out: (m) => logs.push(m),
          err: (m) => logs.push(m),
          exit: (c) => { exitCode = c; return c; },
          cwd: tmpDir
        }
      );

      assert.strictEqual(code ?? exitCode, 0);
      assert.ok(logs.some((l) => l.includes('Prompt Ledger Clean')));
    });

    test('exits 1 and lists open items when pending directives exist', () => {
      const ledgerDir = path.join(tmpDir, '.agents', 'ledger');
      fs.mkdirSync(ledgerDir, { recursive: true });
      fs.writeFileSync(
        path.join(ledgerDir, 'pending.md'),
        '# Ledger\n- [ ] Unfinished requirement\n- [x] Done requirement\n',
        'utf-8'
      );

      const logs: string[] = [];
      let exitCode: number | null = null;

      const code = handlePromptCommand(
        { command: 'prompt', targetDir: null, force: false, noGit: false, dryRun: false, silent: false, terminal: null },
        {
          out: (m) => logs.push(m),
          err: (m) => logs.push(m),
          exit: (c) => { exitCode = c; return c; },
          cwd: tmpDir
        }
      );

      assert.strictEqual(code ?? exitCode, 1);
      assert.ok(logs.some((l) => l.includes('PROMPT DIRECTIVES PENDING (1)')));
      assert.ok(logs.some((l) => l.includes('Unfinished requirement')));
    });

    test('respects silent option when running cleanly', () => {
      const logs: string[] = [];
      let exitCode: number | null = null;

      const code = handlePromptCommand(
        { command: 'prompt', targetDir: null, force: false, noGit: false, dryRun: false, silent: true, terminal: null },
        {
          out: (m) => logs.push(m),
          err: (m) => logs.push(m),
          exit: (c) => { exitCode = c; return c; },
          cwd: tmpDir
        }
      );

      assert.strictEqual(code ?? exitCode, 0);
      assert.strictEqual(logs.length, 0);
    });

    test('respects silent option when ledger is clean', () => {
      const ledgerDir = path.join(tmpDir, '.agents', 'ledger');
      fs.mkdirSync(ledgerDir, { recursive: true });
      fs.writeFileSync(path.join(ledgerDir, 'pending.md'), '- [x] Done\n', 'utf-8');

      const logs: string[] = [];
      let exitCode: number | null = null;

      const code = handlePromptCommand(
        { command: 'prompt', targetDir: null, force: false, noGit: false, dryRun: false, silent: true, terminal: null },
        {
          out: (m) => logs.push(m),
          err: (m) => logs.push(m),
          exit: (c) => { exitCode = c; return c; },
          cwd: tmpDir
        }
      );

      assert.strictEqual(code ?? exitCode, 0);
      assert.strictEqual(logs.length, 0);
    });

    test('supports explicit targetDir path', () => {
      const subDir = path.join(tmpDir, 'custom-sub');
      const ledgerDir = path.join(subDir, '.agents', 'ledger');
      fs.mkdirSync(ledgerDir, { recursive: true });
      fs.writeFileSync(path.join(ledgerDir, 'pending.md'), '- [x] Sub done\n', 'utf-8');

      const logs: string[] = [];
      let exitCode: number | null = null;

      const code = handlePromptCommand(
        { command: 'prompt', targetDir: 'custom-sub', force: false, noGit: false, dryRun: false, silent: false, terminal: null },
        {
          out: (m) => logs.push(m),
          err: (m) => logs.push(m),
          exit: (c) => { exitCode = c; return c; },
          cwd: tmpDir
        }
      );

      assert.strictEqual(code ?? exitCode, 0);
      assert.ok(logs.some((l) => l.includes('Prompt Ledger Clean')));
    });
  });
});
