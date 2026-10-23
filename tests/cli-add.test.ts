import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { handleAddCommand } from '../src/cli-add.js';
import type { AddIo } from '../src/cli-add.js';

describe('CLI Add Command', () => {
  let tmpDir: string;
  let stdoutLogs: string[];
  let stderrLogs: string[];
  let exitCode: number | null;

  function createIo(): AddIo {
    return {
      out: (msg) => stdoutLogs.push(msg),
      err: (msg) => stderrLogs.push(msg),
      exit: (code) => {
        exitCode = code;
        return code;
      },
      cwd: tmpDir
    };
  }

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-cli-add-'));
    stdoutLogs = [];
    stderrLogs = [];
    exitCode = null;
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('fails with exit 1 if packName is missing', () => {
    const io = createIo();
    const code = handleAddCommand(
      {
        command: 'add',
        targetDir: null,
        packName: null,
        force: false,
        noGit: false,
        dryRun: false,
        silent: false,
        terminal: null
      },
      io
    );

    assert.strictEqual(code ?? exitCode, 1);
    assert.ok(stderrLogs.some((l) => l.includes('Missing pack name')));
  });

  test('successfully installs pack into workspace', () => {
    const io = createIo();
    const code = handleAddCommand(
      {
        command: 'add',
        targetDir: null,
        packName: 'tdd',
        force: false,
        noGit: false,
        dryRun: false,
        silent: false,
        terminal: null
      },
      io
    );

    assert.strictEqual(code ?? exitCode, 0);
    assert.ok(stdoutLogs.some((l) => l.includes('Installed capability pack: tdd')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'harness.yaml')));
  });

  test('reports when pack is already installed', () => {
    const io = createIo();
    handleAddCommand(
      {
        command: 'add',
        targetDir: null,
        packName: 'tdd',
        force: false,
        noGit: false,
        dryRun: false,
        silent: false,
        terminal: null
      },
      io
    );

    const secondCode = handleAddCommand(
      {
        command: 'add',
        targetDir: null,
        packName: 'tdd',
        force: false,
        noGit: false,
        dryRun: false,
        silent: false,
        terminal: null
      },
      io
    );

    assert.strictEqual(secondCode ?? exitCode, 0);
    assert.ok(stdoutLogs.some((l) => l.includes('already installed')));
  });

  test('honors --dry-run without modifying filesystem', () => {
    const io = createIo();
    const code = handleAddCommand(
      {
        command: 'add',
        targetDir: null,
        packName: 'boundaries',
        force: false,
        noGit: false,
        dryRun: true,
        silent: false,
        terminal: null
      },
      io
    );

    assert.strictEqual(code ?? exitCode, 0);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'harness.yaml')), false);
    assert.ok(stdoutLogs.some((l) => l.includes('[dry-run]')));
  });

  test('honors --silent suppressing standard output', () => {
    const io = createIo();
    const code = handleAddCommand(
      {
        command: 'add',
        targetDir: null,
        packName: 'coverage',
        force: false,
        noGit: false,
        dryRun: false,
        silent: true,
        terminal: null
      },
      io
    );

    assert.strictEqual(code ?? exitCode, 0);
    assert.strictEqual(stdoutLogs.length, 0);
    assert.ok(fs.existsSync(path.join(tmpDir, 'harness.yaml')));
  });

  test('handles explicit targetDir', () => {
    const subDir = path.join(tmpDir, 'sub-repo');
    fs.mkdirSync(subDir, { recursive: true });

    const io = createIo();
    const code = handleAddCommand(
      {
        command: 'add',
        targetDir: 'sub-repo',
        packName: 'docker',
        force: false,
        noGit: false,
        dryRun: false,
        silent: false,
        terminal: null
      },
      io
    );

    assert.strictEqual(code ?? exitCode, 0);
    assert.ok(fs.existsSync(path.join(subDir, 'harness.yaml')));
  });

  test('handles unexpected install errors with exit 1', () => {
    const io = createIo();
    const code = handleAddCommand(
      {
        command: 'add',
        targetDir: '\0invalid-path',
        packName: 'tdd',
        force: false,
        noGit: false,
        dryRun: false,
        silent: false,
        terminal: null
      },
      io
    );

    assert.strictEqual(code ?? exitCode, 1);
    assert.ok(stderrLogs.some((l) => l.includes('Error installing pack')));
  });
});
