import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parseArgs } from '../src/cli-parse.js';
import { runCli } from '../src/cli.js';
import { resolveBoundaryTarget } from '../src/cli-boundaries.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.resolve(__dirname, '..', 'bin', 'azcodr.js');
const REPO_ROOT = path.resolve(__dirname, '..');
const EXAMPLE_SRC = path.resolve(REPO_ROOT, 'examples', 'clean-architecture-todo', 'src');

describe('CLI Boundaries Command (Architecture Linter)', () => {
  describe('parseArgs recognition', () => {
    test('parses boundaries subcommand', () => {
      const parsed = parseArgs(['boundaries']);
      assert.strictEqual(parsed.command, 'boundaries');
      assert.strictEqual(parsed.targetDir, null);
    });

    test('parses boundary alias with custom target directory', () => {
      const parsed = parseArgs(['boundary', './custom-src']);
      assert.strictEqual(parsed.command, 'boundaries');
      assert.strictEqual(parsed.targetDir, './custom-src');
    });

    test('parses cycles alias', () => {
      const parsed = parseArgs(['cycles', './lib']);
      assert.strictEqual(parsed.command, 'boundaries');
      assert.strictEqual(parsed.targetDir, './lib');
    });
  });

  describe('resolveBoundaryTarget', () => {
    test('resolves explicit targetDir relative to cwd', () => {
      assert.strictEqual(resolveBoundaryTarget('sub', REPO_ROOT), path.resolve(REPO_ROOT, 'sub'));
    });

    test('defaults to src directory if it exists in cwd', () => {
      assert.strictEqual(resolveBoundaryTarget(null, REPO_ROOT), path.join(REPO_ROOT, 'src'));
    });

    test('defaults to cwd if src does not exist', () => {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-nobound-'));
      try {
        assert.strictEqual(resolveBoundaryTarget(null, tmp), tmp);
      } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
      }
    });
  });

  describe('runCli boundaries execution', () => {
    test('exits 0 and logs success for clean example source tree', async () => {
      const logs: string[] = [];
      let exitCode: number | null = null;
      const io = {
        out: (m: string) => logs.push(m),
        err: (m: string) => logs.push(m),
        exit: (c: number) => { exitCode = c; return c; },
        cwd: REPO_ROOT
      };

      await runCli(['boundaries', EXAMPLE_SRC], io);
      assert.strictEqual(exitCode, 0);
      const combined = logs.join('\n');
      assert.match(combined, /Inspecting Architectural Boundaries/i);
      assert.match(combined, /0 circular cycles, 0 boundary violations/i);
    });

    test('exits 1 and reports violations when target has layer breaches or cycles', async () => {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-cli-bound-'));
      try {
        fs.mkdirSync(path.join(tmp, 'domain'), { recursive: true });
        fs.mkdirSync(path.join(tmp, 'infrastructure'), { recursive: true });
        fs.writeFileSync(path.join(tmp, 'infrastructure', 'db.ts'), 'export const db = 1;');
        fs.writeFileSync(
          path.join(tmp, 'domain', 'order.ts'),
          "import '../infrastructure/db.js';\nexport const order = 1;"
        );

        const logs: string[] = [];
        let exitCode: number | null = null;
        const io = {
          out: (m: string) => logs.push(m),
          err: (m: string) => logs.push(m),
          exit: (c: number) => { exitCode = c; return c; },
          cwd: REPO_ROOT
        };

        await runCli(['boundaries', tmp], io);
        assert.strictEqual(exitCode, 1);
        const combined = logs.join('\n');
        assert.match(combined, /ARCHITECTURAL VIOLATIONS DETECTED/i);
        assert.match(combined, /Layer Boundary Breach/i);
      } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
      }
    });

    test('respects --silent flag by producing zero stdout output', async () => {
      const logs: string[] = [];
      let exitCode: number | null = null;
      const io = {
        out: (m: string) => logs.push(m),
        err: (m: string) => logs.push(m),
        exit: (c: number) => { exitCode = c; return c; },
        cwd: REPO_ROOT
      };

      await runCli(['boundaries', EXAMPLE_SRC, '--silent'], io);
      assert.strictEqual(exitCode, 0);
      assert.strictEqual(logs.length, 0);
    });

    test('detects and logs circular dependency violations', async () => {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-cli-cycle-'));
      try {
        fs.mkdirSync(path.join(tmp, 'services'), { recursive: true });
        fs.writeFileSync(path.join(tmp, 'services', 'a.ts'), "import './b.js';\nexport const a = 1;");
        fs.writeFileSync(path.join(tmp, 'services', 'b.ts'), "import './a.js';\nexport const b = 1;");

        const logs: string[] = [];
        let exitCode: number | null = null;
        const io = {
          out: (m: string) => logs.push(m),
          err: (m: string) => logs.push(m),
          exit: (c: number) => { exitCode = c; return c; },
          cwd: REPO_ROOT
        };

        await runCli(['boundaries', tmp], io);
        assert.strictEqual(exitCode, 1);
        const combined = logs.join('\n');
        assert.match(combined, /ARCHITECTURAL VIOLATIONS DETECTED/i);
        assert.match(combined, /Circular Dependency/i);
      } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
      }
    });

    test('defaults to cwd/src when target directory is omitted', async () => {
      let exitCode: number | null = null;
      const io = {
        out: () => {},
        err: () => {},
        exit: (c: number) => { exitCode = c; return c; },
        cwd: path.resolve(REPO_ROOT, 'examples', 'clean-architecture-todo')
      };

      await runCli(['boundaries'], io);
      assert.strictEqual(exitCode, 0);
    });
  });

  describe('CLI Process Acceptance (azcodr boundaries)', () => {
    test('runs bin/azcodr.js boundaries on example project and exits 0', () => {
      const out = execFileSync(process.execPath, [CLI_PATH, 'boundaries', EXAMPLE_SRC], {
        encoding: 'utf-8',
        cwd: REPO_ROOT
      });
      assert.match(out, /Inspecting Architectural Boundaries/i);
      assert.match(out, /0 circular cycles, 0 boundary violations/i);
    });
  });
});
