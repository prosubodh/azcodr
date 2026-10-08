import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import * as validateModule from '../scripts/validate.js';

/**
 * Runs a validation phase against a synthetic workspace fixture.
 * `reporter` collects messages instead of printing them so assertions can
 * inspect the exact pass/warn/fail outcome rather than scraping stdout.
 */
function runValidation(root: string) {
  const lines: string[] = [];
  const reporter = {
    pass: (msg: string) => lines.push(`PASS ${msg}`),
    warn: (msg: string) => lines.push(`WARN ${msg}`),
    fail: (msg: string) => lines.push(`FAIL ${msg}`),
    log: () => {},
    heading: () => {}
  };
  const result: any = validateModule.runValidation(root, reporter);
  result.lines = lines;
  return { result, lines };
}

function writeParityFiles(root: string) {
  for (const name of ['CLAUDE.md', 'GEMINI.md', '.cursorrules', '.windsurfrules']) {
    fs.writeFileSync(path.join(root, name), 'AGENTS.md\n');
  }
  fs.writeFileSync(path.join(root, '.gitignore'), 'node_modules/\n');
  fs.mkdirSync(path.join(root, '.git'), { recursive: true });
}

function writeRuleFixture(rulesDir: string) {
  fs.mkdirSync(rulesDir, { recursive: true });
  fs.writeFileSync(
    path.join(rulesDir, 'good.md'),
    '# Good Rule\n\n> **Core Mandate:** Be good.\n\n## What NOT to do\n\nNope.\n'
  );
}

function writeSkillFixture(skillsDir: string) {
  const skillDir = path.join(skillsDir, 'demo');
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(
    path.join(skillDir, 'SKILL.md'),
    '---\nname: demo\ndescription: "Use when testing. Do not use for production."\n---\n\n# Demo\n\n## Gotchas\n\nNone.\n'
  );
}

function createFixture(overrides: any = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-validate-'));
  const agentsLines = overrides.agentsLines || 40;
  const agents = overrides.agentsContent || '# Agents\n' + 'x\n'.repeat(agentsLines);
  fs.writeFileSync(path.join(root, 'AGENTS.md'), agents);
  writeParityFiles(root);
  if (overrides.rules !== false) writeRuleFixture(path.join(root, 'docs', 'rules'));
  else fs.mkdirSync(path.join(root, 'docs', 'rules'), { recursive: true });
  if (overrides.skills !== false) writeSkillFixture(path.join(root, '.agents', 'skills'));
  else fs.mkdirSync(path.join(root, '.agents', 'skills'), { recursive: true });
  fs.writeFileSync(path.join(root, 'memory.md'), '# Memory\n\nClean slate.\n');
  if (overrides.markdown) {
    fs.writeFileSync(path.join(root, 'NOTES.md'), overrides.markdown);
  }
  return root;
}

describe('Validator: module surface', () => {
  test('exports runValidation and parseArgs without executing on require', () => {
    assert.strictEqual(typeof validateModule.runValidation, 'function');
    assert.strictEqual(typeof validateModule.parseArgs, 'function');
  });

  test('requiring the validator does not call process.exit', () => {
    assert.strictEqual((validateModule as any).__didAutoRun, undefined);
  });
});

describe('Validator: parseArgs', () => {
  test('returns cwd when no arguments are supplied', () => {
    assert.strictEqual(validateModule.parseArgs([]), process.cwd());
  });

  test('returns the first positional argument as the root', () => {
    assert.strictEqual(validateModule.parseArgs(['/tmp/some-root']), '/tmp/some-root');
  });

  test('ignores the --fix flag and still resolves the positional root', () => {
    assert.strictEqual(validateModule.parseArgs(['--fix', '/tmp/root']), '/tmp/root');
  });

  test('returns the first positional argument when multiple are provided', () => {
    assert.strictEqual(validateModule.parseArgs(['dir1', 'dir2']), 'dir1');
  });
});

describe('Validator: healthy workspace', () => {
  let root: string;
  beforeEach(() => { root = createFixture(); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('reports zero errors for a well-formed workspace', () => {
    const { result } = runValidation(root);
    assert.strictEqual(result.errors, 0, `lines: ${result.lines.join(' | ')}`);
  });

  test('records every phase heading and the rule/skill tallies', () => {
    const { result } = runValidation(root);
    assert.strictEqual(result.validatedRules, 1);
    assert.strictEqual(result.validatedSkills, 1);
    assert.strictEqual(result.totalLinks, 0);
    assert.strictEqual(result.brokenLinks.length, 0);
  });

  test('resolves relative markdown links and counts them', () => {
    const withLink = createFixture({ markdown: '# Notes\n\nSee [rule](docs/rules/good.md).\n' });
    try {
      const { result } = runValidation(withLink);
      assert.strictEqual(result.totalLinks, 1);
      assert.strictEqual(result.brokenLinks.length, 0);
    } finally {
      fs.rmSync(withLink, { recursive: true, force: true });
    }
  });
});

describe('Validator: main entry point', () => {
  let root: string;
  beforeEach(() => { root = createFixture(); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('main exits 0 on valid root and 1 on invalid root', () => {
    let exitCode: number | null = null;
    const fakeExit = (code: number) => { exitCode = code; return code; };
    validateModule.main([root], fakeExit as any);
    assert.strictEqual(exitCode, 0);

    validateModule.main(['/non-existent-path-never-exists'], fakeExit as any);
    assert.strictEqual(exitCode, 1);
  });

  test('main supports default argv and exit parameters', () => {
    const origArgv = process.argv;
    const origExit = process.exit;
    try {
      process.argv = [process.execPath, 'scripts/validate-cli.js', root];
      let exitCode: number | null = null;
      (process as any).exit = (c: number) => { exitCode = c; return c as never; };
      validateModule.main();
      assert.strictEqual(exitCode, 0);
    } finally {
      process.argv = origArgv;
      process.exit = origExit;
    }
  });
});