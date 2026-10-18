import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { runValidation } from '../src/validator/run.js';
import { collector } from './support/reporter.js';

function collect(root: string) {
  const { logs, reporter } = collector();
  const result = runValidation(root, reporter);
  return { result, lines: logs };
}

function baseFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-bound-'));
  fs.writeFileSync(path.join(root, 'AGENTS.md'), '# A\n');
  for (const n of ['CLAUDE.md', 'GEMINI.md', '.cursorrules', '.windsurfrules']) {
    fs.writeFileSync(path.join(root, n), 'AGENTS.md\n');
  }
  fs.writeFileSync(path.join(root, '.gitignore'), 'node_modules/\n');
  const rules = path.join(root, 'docs', 'rules');
  fs.mkdirSync(rules, { recursive: true });
  fs.writeFileSync(path.join(rules, 'r.md'), '# R\n\n> **Core Mandate:** x\n');
  const skills = path.join(root, '.agents', 'skills');
  fs.mkdirSync(path.join(skills, 'demo'), { recursive: true });
  fs.writeFileSync(
    path.join(skills, 'demo', 'SKILL.md'),
    '---\nname: demo\ndescription: Use when testing. Do not use in prod.\n---\n\n## Gotchas\n\nn\n'
  );
  fs.writeFileSync(path.join(root, 'memory.md'), '# Memory\n\nslate\n');
  return root;
}

function agentsMdWithLines(n: number) {
  return new Array(n).fill('line').join('\n');
}

describe('AGENTS.md line budget lean', () => {
  let root: string;
  beforeEach(() => { root = baseFixture(); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('120 lines passes the lean budget', () => {
    fs.writeFileSync(path.join(root, 'AGENTS.md'), agentsMdWithLines(120));
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /AGENTS\.md line count is lean: 120 lines/.test(l)), lines.join(' | '));
    assert.ok(!lines.some((l) => /^FAIL AGENTS\.md line count/.test(l)));
  });

  test('121 lines warns but does not fail', () => {
    fs.writeFileSync(path.join(root, 'AGENTS.md'), agentsMdWithLines(121));
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /WARN AGENTS\.md line count is getting large: 121 lines/.test(l)), lines.join(' | '));
    assert.ok(!lines.some((l) => /^FAIL AGENTS\.md/.test(l)));
  });
});

describe('AGENTS.md length is advisory, never a build failure', () => {
  let root: string;
  beforeEach(() => { root = baseFixture(); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('a very long AGENTS.md warns rather than failing the build', () => {
    fs.writeFileSync(path.join(root, 'AGENTS.md'), agentsMdWithLines(400));
    const { lines, result } = collect(root);
    assert.ok(lines.some((l) => /WARN AGENTS\.md line count is getting large: 400 lines/.test(l)));
    assert.strictEqual(result.errors, 0, 'document length is not a defect');
  });
});

describe('optional governance files are absent by choice', () => {
  let root: string;
  beforeEach(() => { root = baseFixture(); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('a workspace with no AGENTS.md still validates cleanly', () => {
    fs.rmSync(path.join(root, 'AGENTS.md'));
    const { lines, result } = collect(root);
    assert.ok(lines.some((l) => /SKIP No AGENTS\.md/.test(l)), lines.join(' | '));
    assert.strictEqual(result.errors, 0, 'not using this harness is not a defect');
  });

  test('parity files a project does not maintain are not reported', () => {
    fs.rmSync(path.join(root, 'CLAUDE.md'));
    fs.rmSync(path.join(root, 'GEMINI.md'));
    const { lines } = collect(root);
    assert.ok(!lines.some((l) => /CLAUDE\.md is missing/.test(l)), lines.join(' | '));
    assert.ok(!lines.some((l) => /GEMINI\.md is missing/.test(l)), lines.join(' | '));
  });

  test('a missing .gitignore is skipped, not failed', () => {
    fs.rmSync(path.join(root, '.gitignore'));
    const { lines, result } = collect(root);
    assert.ok(!lines.some((l) => /FAIL .*gitignore/.test(l)), lines.join(' | '));
    assert.strictEqual(result.errors, 0);
  });
});

describe('a parity file that exists must agree with the agent contract', () => {
  let root: string;
  beforeEach(() => { root = baseFixture(); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('a parity file pointing somewhere else is a real inconsistency', () => {
    fs.writeFileSync(path.join(root, 'CLAUDE.md'), 'OTHER.md\n');
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /FAIL CLAUDE\.md is not a symbolic link/.test(l)), lines.join(' | '));
  });

  test('parity files pointing at AGENTS.md are accepted', () => {
    const { result } = collect(root);
    assert.strictEqual(result.errors, 0);
  });
});
