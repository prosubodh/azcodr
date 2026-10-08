import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parseArgs } from '../src/cli-parse.js';
import { runCli } from '../src/cli.js';
import { validate, createSilentReporter } from '../src/index.js';
import type { ValidationReporter } from '../src/validate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.resolve(__dirname, '..', 'bin', 'azcodr.js');
const REPO_ROOT = path.resolve(__dirname, '..');

function createCheckMockIo(overrides: Record<string, unknown> = {}) {
  const stdoutLogs: string[] = [];
  const stderrLogs: string[] = [];
  let exitCode: number | null = null;
  return {
    out: (m: string) => stdoutLogs.push(m),
    err: (m: string) => stderrLogs.push(m),
    exit: (c: number) => { exitCode = c; return c; },
    cwd: (overrides['cwd'] as string) || REPO_ROOT,
    validate: overrides['validate'] as any,
    get stdoutLogs() { return stdoutLogs; },
    get stderrLogs() { return stderrLogs; },
    get exitCode() { return exitCode; }
  };
}

describe('CLI Check & Validate Command (Track 1)', () => {
  describe('parseArgs command recognition', () => {
    test('parses check subcommand', () => {
      const parsed = parseArgs(['check']);
      assert.strictEqual(parsed.command, 'check');
      assert.strictEqual(parsed.targetDir, null);
    });

    test('parses check with target directory', () => {
      const parsed = parseArgs(['check', './custom-dir']);
      assert.strictEqual(parsed.command, 'check');
      assert.strictEqual(parsed.targetDir, './custom-dir');
    });

    test('parses validate alias and flags', () => {
      const parsed = parseArgs(['validate', './target', '--silent']);
      assert.strictEqual(parsed.command, 'check');
      assert.strictEqual(parsed.targetDir, './target');
      assert.strictEqual(parsed.silent, true);
    });

    test('parses audit alias', () => {
      const parsed = parseArgs(['audit']);
      assert.strictEqual(parsed.command, 'check');
    });
  });

  describe('runCli delegation to validator', () => {
    test('exits 0 when validator returns 0 errors', async () => {
      let targetPassed = '';
      const io = createCheckMockIo({
        validate: async (target: string) => {
          targetPassed = target;
          return { errors: 0, warnings: 0 };
        }
      });
      await runCli(['check'], io);
      assert.strictEqual(io.exitCode, 0);
      assert.strictEqual(targetPassed, REPO_ROOT);
    });

    test('exits 1 when validator reports errors', async () => {
      const io = createCheckMockIo({
        validate: async () => ({ errors: 3, warnings: 1 })
      });
      await runCli(['check'], io);
      assert.strictEqual(io.exitCode, 1);
    });

    test('resolves relative target directory against io.cwd', async () => {
      let targetPassed = '';
      const io = createCheckMockIo({
        cwd: REPO_ROOT,
        validate: async (target: string) => {
          targetPassed = target;
          return { errors: 0, warnings: 0 };
        }
      });
      await runCli(['check', 'some/subfolder'], io);
      assert.strictEqual(targetPassed, path.resolve(REPO_ROOT, 'some/subfolder'));
    });

    test('provides silent reporter when --silent is specified', async () => {
      let reporterPassed: ValidationReporter | undefined;
      const io = createCheckMockIo({
        validate: async (_dir: string, reporter?: ValidationReporter) => {
          reporterPassed = reporter;
          return { errors: 0, warnings: 0 };
        }
      });
      await runCli(['check', '--silent'], io);
      assert.strictEqual(io.exitCode, 0);
      assert.notStrictEqual(reporterPassed, undefined);
      assert.strictEqual(typeof reporterPassed?.pass, 'function');
      assert.strictEqual(typeof reporterPassed?.warn, 'function');
      reporterPassed?.pass('ok');
      reporterPassed?.warn('warn');
      reporterPassed?.fail('fail');
      reporterPassed?.log('log');
      reporterPassed?.heading('heading');
    });
  });

  describe('Programmatic API validate()', () => {
    test('exports validate and createSilentReporter from root package', () => {
      assert.strictEqual(typeof validate, 'function');
      assert.strictEqual(typeof createSilentReporter, 'function');
      const silent = createSilentReporter();
      silent.pass('p');
      silent.warn('w');
      silent.fail('f');
      silent.log('l');
      silent.heading('h');
    });

    test('executes validation on current workspace successfully with default args', async () => {
      const result = await validate();
      assert.strictEqual(result.errors, 0);
      assert.strictEqual(result.validatedRules, 28);
    });

    test('executes validation on current workspace successfully with custom reporter', async () => {
      const passedLogs: string[] = [];
      const reporter: ValidationReporter = {
        pass: (m) => passedLogs.push(m),
        warn: () => {},
        fail: () => {},
        log: () => {},
        heading: () => {}
      };
      const result = await validate(REPO_ROOT, reporter);
      assert.strictEqual(result.errors, 0);
      assert.strictEqual(result.validatedRules, 28);
      assert.strictEqual(result.validatedSkills, 6);
      assert.ok(passedLogs.length > 0);
    });
  });

  describe('CLI Process Acceptance (azcodr check)', () => {
    test('runs bin/azcodr.js check on workspace and exits 0', () => {
      const output = execFileSync(process.execPath, [CLI_PATH, 'check'], {
        encoding: 'utf-8',
        cwd: REPO_ROOT
      });
      assert.match(output, /Validating Agentic Architecture/);
      assert.match(output, /SUCCESS: All agentic configurations are valid/);
    });

    test('runs bin/azcodr.js check --silent with empty stdout', () => {
      const output = execFileSync(process.execPath, [CLI_PATH, 'check', '--silent'], {
        encoding: 'utf-8',
        cwd: REPO_ROOT
      });
      assert.strictEqual(output.trim(), '');
    });

    test('runs bin/azcodr.js check against nonexistent dir and exits 1', () => {
      let exitCode: number | null = null;
      let stdout = '';
      try {
        execFileSync(process.execPath, [CLI_PATH, 'check', './nonexistent-workspace-path'], {
          encoding: 'utf-8',
          cwd: REPO_ROOT,
          stdio: ['ignore', 'pipe', 'pipe']
        });
        exitCode = 0;
      } catch (err: any) {
        exitCode = err.status;
        stdout = err.stdout;
      }
      assert.strictEqual(exitCode, 1);
      assert.match(stdout, /FAILURE: Found \d+ error\(s\)/);
    });
  });
});
