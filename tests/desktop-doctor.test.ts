/**
 * Desktop doctor regression tests (Milestone 4).
 * Prevents hybrid desktop build mismatches (missing custom-protocol, hollow CSS, dev-url embedding).
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const DOCTOR_SCRIPT = path.join(REPO_ROOT, '.agents', 'scripts', 'desktop_doctor.js');

let tmpDir: string;
beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-desktop-doc-'));
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

describe('Desktop Doctor: Cargo Tauri custom-protocol check', () => {
  test('passes when Tauri has custom-protocol feature declared', async () => {
    const fixture = path.join(tmpDir, 'valid-tauri');
    writeFixture(fixture, {
      'Cargo.toml': '[dependencies]\ntauri = { version = "2.0", features = ["custom-protocol"] }\n',
      'dist/assets/index.css': 'a'.repeat(6000)
    });
    const stdout = execFileSync(process.execPath, [DOCTOR_SCRIPT, fixture], {
      encoding: 'utf-8',
      cwd: REPO_ROOT
    });
    assert.match(stdout, /Custom protocol enabled/);
    assert.match(stdout, /CSS bundle density verified/);
  });

  test('fails when Tauri is present but custom-protocol is missing', () => {
    const fixture = path.join(tmpDir, 'missing-proto');
    writeFixture(fixture, {
      'Cargo.toml': '[dependencies]\ntauri = { version = "2.0" }\n',
      'dist/assets/index.css': 'a'.repeat(6000)
    });
    let exitCode: number | null = null;
    let stderr = '';
    try {
      execFileSync(process.execPath, [DOCTOR_SCRIPT, fixture], {
        encoding: 'utf-8',
        cwd: REPO_ROOT,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      exitCode = 0;
    } catch (err: any) {
      exitCode = err.status;
      stderr = err.stderr || '';
    }
    assert.strictEqual(exitCode, 1);
    assert.match(stderr, /Missing 'custom-protocol'/);
  });
});

describe('Desktop Doctor: CSS bundle density check', () => {
  test('fails when CSS bundle is hollow (< 5000 bytes)', () => {
    const fixture = path.join(tmpDir, 'hollow-css');
    writeFixture(fixture, {
      'Cargo.toml': '[dependencies]\ntauri = { version = "2.0", features = ["custom-protocol"] }\n',
      'dist/assets/index.css': '/* empty */\n'
    });
    let exitCode: number | null = null;
    let stderr = '';
    try {
      execFileSync(process.execPath, [DOCTOR_SCRIPT, fixture], {
        encoding: 'utf-8',
        cwd: REPO_ROOT,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      exitCode = 0;
    } catch (err: any) {
      exitCode = err.status;
      stderr = err.stderr || '';
    }
    assert.strictEqual(exitCode, 1);
    assert.match(stderr, /Hollow CSS bundle detected/);
  });

  test('skips checks gracefully when no Cargo or dist exists', () => {
    const fixture = path.join(tmpDir, 'non-desktop');
    writeFixture(fixture, {
      'package.json': '{"name":"plain-node"}\n'
    });
    const stdout = execFileSync(process.execPath, [DOCTOR_SCRIPT, fixture], {
      encoding: 'utf-8',
      cwd: REPO_ROOT
    });
    assert.match(stdout, /No desktop artifacts found/);
  });
});
