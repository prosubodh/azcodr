import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  phaseToolchain,
  readProfileLanguage,
  expectedToolchainFiles,
  TOOLCHAIN_FILES
} from '../scripts/validate.js';

function makeCtx(root: string) {
  const lines: string[] = [];
  return {
    ctx: {
      workspaceRoot: root,
      log: () => {},
      heading: () => {},
      pass: (m: string) => lines.push(`PASS ${m}`),
      warn: (m: string) => lines.push(`WARN ${m}`),
      fail: (m: string) => lines.push(`FAIL ${m}`)
    },
    lines,
    joined: () => lines.join('\n')
  };
}

function writeProfile(root: string, body: string) {
  fs.mkdirSync(path.join(root, '.azcodr'), { recursive: true });
  fs.writeFileSync(path.join(root, '.azcodr', 'workspace-profile.env'), body, 'utf-8');
}

describe('validate toolchain: profile language resolution', () => {
  test('returns null without a profile and for empty input', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-tc-'));
    try {
      assert.strictEqual(readProfileLanguage(root), null);
      assert.deepStrictEqual(expectedToolchainFiles(undefined), []);
      assert.deepStrictEqual(expectedToolchainFiles(''), []);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('returns null when the profile names no language', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-tc-'));
    try {
      writeProfile(root, 'topology=backend\n');
      assert.strictEqual(readProfileLanguage(root), null);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('maps every documented language to its gate files', () => {
    assert.deepStrictEqual(expectedToolchainFiles('typescript'), ['eslint.config.js']);
    assert.deepStrictEqual(expectedToolchainFiles('python'), ['ruff.toml']);
    assert.deepStrictEqual(expectedToolchainFiles('rust'), ['clippy.toml']);
    assert.deepStrictEqual(expectedToolchainFiles('go'), ['.golangci.yml']);
    assert.deepStrictEqual(expectedToolchainFiles('java'), ['checkstyle.xml']);
    assert.deepStrictEqual(expectedToolchainFiles('generic'), []);
    assert.deepStrictEqual(expectedToolchainFiles('cobol'), []);
    assert.ok(Object.keys(TOOLCHAIN_FILES).length >= 12);
  });
});

describe('validate toolchain: phase verdicts', () => {
  test('skips cleanly without a workspace profile', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-tc-'));
    try {
      const { ctx, joined } = makeCtx(root);
      phaseToolchain(ctx as any);
      assert.match(joined(), /skipped/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('passes with nothing to enforce for generic', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-tc-'));
    try {
      writeProfile(root, 'topology=backend\nlanguage=generic\n');
      const { ctx, joined } = makeCtx(root);
      phaseToolchain(ctx as any);
      assert.match(joined(), /nothing to enforce/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('fails naming the missing gate file', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-tc-'));
    try {
      writeProfile(root, 'topology=backend\nlanguage=typescript\n');
      const { ctx, joined } = makeCtx(root);
      phaseToolchain(ctx as any);
      assert.match(joined(), /Missing toolchain gate 'eslint\.config\.js'/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('passes when the gate files are present', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-tc-'));
    try {
      writeProfile(root, 'topology=backend\nlanguage=python\n');
      fs.writeFileSync(path.join(root, 'ruff.toml'), '[lint]\n', 'utf-8');
      const { ctx, joined } = makeCtx(root);
      phaseToolchain(ctx as any);
      assert.match(joined(), /Toolchain gates present/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
