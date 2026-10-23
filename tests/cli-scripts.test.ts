import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import {
  isScriptCommand,
  handleScriptCommand,
  SCRIPT_COMMANDS,
  type ScriptIo
} from '../src/cli-scripts.js';
import { runCli } from '../src/cli.js';
import { parseArgs } from '../src/cli-parse.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

let tmpDir: string;

function setUpTmp() {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-cli-scripts-test-'));
}

function tearDownTmp() {
  if (tmpDir && fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

interface MockIoResult {
  stdoutLogs: string[];
  stderrLogs: string[];
  exitCode: number | null;
  spawnCalls: Array<{ file: string; args: string[]; options: any }>;
  io: ScriptIo & { stdoutLogs: string[]; stderrLogs: string[]; exitCode: number | null };
}

function createMockIo(overrides: Partial<ScriptIo> = {}): MockIoResult {
  const stdoutLogs: string[] = [];
  const stderrLogs: string[] = [];
  let exitCode: number | null = null;
  const spawnCalls: Array<{ file: string; args: string[]; options: any }> = [];

  const io: ScriptIo & { stdoutLogs: string[]; stderrLogs: string[]; exitCode: number | null } = {
    out: (msg: string) => stdoutLogs.push(msg),
    err: (msg: string) => stderrLogs.push(msg),
    exit: (code: number) => {
      exitCode = code;
      return code;
    },
    cwd: tmpDir,
    spawn: (file: string, args: string[], options: any) => {
      spawnCalls.push({ file, args, options });
      return { status: 0 };
    },
    get stdoutLogs() {
      return stdoutLogs;
    },
    get stderrLogs() {
      return stderrLogs;
    },
    get exitCode() {
      return exitCode;
    },
    ...overrides
  };

  return { stdoutLogs, stderrLogs, exitCode: null, spawnCalls, io };
}

describe('CLI Scripts: command recognition', () => {
  test('isScriptCommand identifies all defined script commands', () => {
    const expected = ['guard', 'doctor', 'smoke', 'pre-push', 'completion', 'bootstrap', 'export'];
    for (const cmd of expected) {
      assert.strictEqual(isScriptCommand(cmd as any), true, `expected ${cmd} to be recognized`);
    }
    assert.strictEqual(isScriptCommand('scaffold' as any), false);
    assert.strictEqual(isScriptCommand('check' as any), false);
    assert.strictEqual(isScriptCommand('boundaries' as any), false);
    assert.strictEqual(isScriptCommand('nonexistent' as any), false);
  });
});

describe('CLI Scripts: handler execution', () => {
  beforeEach(setUpTmp);
  afterEach(tearDownTmp);

  test('guard command executes agent_guard.js with forwarded arguments', () => {
    const mock = createMockIo();
    const parsed = parseArgs(['guard', 'rm', '-rf', '/']);
    handleScriptCommand(parsed, mock.io);

    assert.strictEqual(mock.io.exitCode, 0);
    assert.strictEqual(mock.spawnCalls.length, 1);
    const call = mock.spawnCalls[0]!;
    assert.ok(call.args[0]!.endsWith('agent_guard.js'));
    assert.deepStrictEqual(call.args.slice(1), ['rm', '-rf', '/']);
  });

  test('doctor command executes desktop_doctor.js with target directory', () => {
    const mock = createMockIo();
    const parsed = parseArgs(['doctor']);
    handleScriptCommand(parsed, mock.io);

    assert.strictEqual(mock.io.exitCode, 0);
    assert.strictEqual(mock.spawnCalls.length, 1);
    const call = mock.spawnCalls[0]!;
    assert.ok(call.args[0]!.endsWith('desktop_doctor.js'));
    assert.deepStrictEqual(call.args.slice(1), [tmpDir]);
  });

  test('smoke command executes smoke_test.js with target directory', () => {
    const mock = createMockIo();
    const parsed = parseArgs(['smoke']);
    handleScriptCommand(parsed, mock.io);

    assert.strictEqual(mock.io.exitCode, 0);
    assert.strictEqual(mock.spawnCalls.length, 1);
    const call = mock.spawnCalls[0]!;
    assert.ok(call.args[0]!.endsWith('smoke_test.js'));
    assert.deepStrictEqual(call.args.slice(1), [tmpDir]);
  });

  test('pre-push command executes pre-push.js with target directory', () => {
    const mock = createMockIo();
    const parsed = parseArgs(['pre-push']);
    handleScriptCommand(parsed, mock.io);

    assert.strictEqual(mock.io.exitCode, 0);
    assert.strictEqual(mock.spawnCalls.length, 1);
    const call = mock.spawnCalls[0]!;
    assert.ok(call.args[0]!.endsWith('pre-push.js'));
    assert.deepStrictEqual(call.args.slice(1), [tmpDir]);
  });

  test('completion command executes verify_completion.js with target directory', () => {
    const mock = createMockIo();
    const parsed = parseArgs(['completion']);
    handleScriptCommand(parsed, mock.io);

    assert.strictEqual(mock.io.exitCode, 0);
    assert.strictEqual(mock.spawnCalls.length, 1);
    const call = mock.spawnCalls[0]!;
    assert.ok(call.args[0]!.endsWith('verify_completion.js'));
    assert.deepStrictEqual(call.args.slice(1), [tmpDir]);
  });

  test('bootstrap command executes bootstrap_workspace.mjs with targetDir and extra args', () => {
    const mock = createMockIo();
    const target = path.join(tmpDir, 'new-app');
    const parsed = parseArgs(['bootstrap', target, 'fullstack', 'typescript']);
    handleScriptCommand(parsed, mock.io);

    assert.strictEqual(mock.io.exitCode, 0);
    assert.strictEqual(mock.spawnCalls.length, 1);
    const call = mock.spawnCalls[0]!;
    assert.ok(call.args[0]!.endsWith('bootstrap_workspace.mjs'));
    assert.deepStrictEqual(call.args.slice(1), [target, 'fullstack', 'typescript']);
  });

  test('export command exports transcript on valid path', () => {
    const transcriptFile = path.join(tmpDir, 'transcript.jsonl');
    fs.writeFileSync(
      transcriptFile,
      JSON.stringify({
        step_index: 1,
        source: 'USER_EXPLICIT',
        type: 'USER_INPUT',
        content: 'Hello world'
      }) + '\n'
    );
    const mock = createMockIo();
    const parsed = parseArgs(['export', transcriptFile, tmpDir]);
    handleScriptCommand(parsed, mock.io);

    assert.strictEqual(mock.io.exitCode, 0);
    assert.ok(mock.stdoutLogs.some((l) => l.includes('Exported conversation transcript')));
    const expectedExport = path.join(tmpDir, 'conversation-export.md');
    assert.strictEqual(fs.existsSync(expectedExport), true);
  });

  test('export command fails when transcript file does not exist', () => {
    const mock = createMockIo();
    const parsed = parseArgs(['export', path.join(tmpDir, 'missing.jsonl')]);
    handleScriptCommand(parsed, mock.io);

    assert.strictEqual(mock.io.exitCode, 1);
    assert.ok(mock.stderrLogs.some((l) => l.includes('Export failed')));
  });
});

describe('CLI Scripts: runCli dispatching integration', () => {
  beforeEach(setUpTmp);
  afterEach(tearDownTmp);

  test('runCli dispatches doctor command', async () => {
    let scriptInvoked = false;
    const mock = {
      out: () => {},
      err: () => {},
      exit: (code: number) => code,
      cwd: tmpDir,
      script: (parsed: any) => {
        scriptInvoked = true;
        assert.strictEqual(parsed.command, 'doctor');
        return 0;
      }
    };
    await runCli(['doctor'], mock as any);
    assert.strictEqual(scriptInvoked, true);
  });

  test('runCli dispatches smoke command', async () => {
    let scriptInvoked = false;
    const mock = {
      out: () => {},
      err: () => {},
      exit: (code: number) => code,
      cwd: tmpDir,
      script: (parsed: any) => {
        scriptInvoked = true;
        assert.strictEqual(parsed.command, 'smoke');
        return 0;
      }
    };
    await runCli(['smoke'], mock as any);
    assert.strictEqual(scriptInvoked, true);
  });

  test('runCli dispatches guard command with extraArgs', async () => {
    let receivedArgs: string[] = [];
    const mock = {
      out: () => {},
      err: () => {},
      exit: (code: number) => code,
      cwd: tmpDir,
      script: (parsed: any) => {
        receivedArgs = parsed.extraArgs;
        return 0;
      }
    };
    await runCli(['guard', 'git', 'push', '--force'], mock as any);
    assert.deepStrictEqual(receivedArgs, ['git', 'push', '--force']);
  });
});
