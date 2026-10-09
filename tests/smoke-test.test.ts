/**
 * Smoke test & environment doctor regression tests (Milestones 1 & 3).
 * Verifies boundaries and detects local port collisions.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const SMOKE_SCRIPT = path.join(REPO_ROOT, '.agents', 'scripts', 'smoke_test.js');

let tmpDir: string;
beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-smoke-test-'));
});

afterEach(() => {
  if (tmpDir && fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

function writeFixture(dir: string, files: Record<string, string>) {
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf-8');
  }
}

describe('Smoke Test & Port Doctor: execution', () => {
  test('executes clean boundary inspection and port check on clean workspace', () => {
    const fixture = path.join(tmpDir, 'clean-workspace');
    writeFixture(fixture, {
      'src/index.ts': 'export const app = 1;\n',
      'package.json': '{"name":"smoke-app"}\n'
    });
    const stdout = execFileSync(process.execPath, [SMOKE_SCRIPT, fixture], {
      encoding: 'utf-8',
      cwd: REPO_ROOT
    });
    assert.match(stdout, /Boundary smoke verification/);
    assert.match(stdout, /Port doctor/);
    assert.match(stdout, /Smoke verification passed/);
  });

  test('reports warning when a monitored dev port is in use', async () => {
    // Spin up a dummy listener on port 5189 to simulate an active background daemon
    const testPort = 5189;
    const server = net.createServer();
    await new Promise<void>((resolve) => server.listen(testPort, '127.0.0.1', resolve));

    try {
      const fixture = path.join(tmpDir, 'active-port-workspace');
      writeFixture(fixture, {
        'src/index.ts': 'export const app = 1;\n',
        'package.json': '{"name":"smoke-app"}\n'
      });
      const stdout = execFileSync(
        process.execPath,
        [SMOKE_SCRIPT, fixture, '--ports', String(testPort)],
        {
          encoding: 'utf-8',
          cwd: REPO_ROOT
        }
      );
      assert.match(stdout, new RegExp(`Port ${testPort} is occupied`));
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
