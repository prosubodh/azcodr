import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { runValidation } from '../scripts/validate.js';

function collect(root: string) {
  const lines: string[] = [];
  const reporter = {
    pass: (msg: string) => lines.push(`PASS ${msg}`),
    warn: (msg: string) => lines.push(`WARN ${msg}`),
    fail: (msg: string) => lines.push(`FAIL ${msg}`),
    log: () => {},
    heading: () => {}
  };
  return { result: runValidation(root, reporter), lines };
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

  test('121 lines warns (crosses the warn threshold)', () => {
    fs.writeFileSync(path.join(root, 'AGENTS.md'), agentsMdWithLines(121));
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /WARN AGENTS\.md line count is getting large: 121 lines/.test(l)), lines.join(' | '));
    assert.ok(!lines.some((l) => /^FAIL AGENTS\.md line count/.test(l)));
  });
});

describe('AGENTS.md line budget hard limit', () => {
  let root: string;
  beforeEach(() => { root = baseFixture(); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('150 lines warns but does not fail', () => {
    fs.writeFileSync(path.join(root, 'AGENTS.md'), agentsMdWithLines(150));
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /WARN AGENTS\.md line count is getting large: 150 lines/.test(l)), lines.join(' | '));
    assert.ok(!lines.some((l) => /^FAIL AGENTS\.md line count/.test(l)));
  });

  test('151 lines fails the hard limit', () => {
    fs.writeFileSync(path.join(root, 'AGENTS.md'), agentsMdWithLines(151));
    const { lines, result } = collect(root);
    assert.ok(lines.some((l) => /FAIL AGENTS\.md exceeds maximum line limit: 151 lines/.test(l)), lines.join(' | '));
    assert.ok(result.errors > 0);
  });
});

describe('missing AGENTS.md', () => {
  let root: string;
  beforeEach(() => { root = baseFixture(); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('fails when AGENTS.md is absent', () => {
    fs.rmSync(path.join(root, 'AGENTS.md'));
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /^FAIL Missing root AGENTS\.md/.test(l)), lines.join(' | '));
  });

  test('reports each missing parity file individually', () => {
    fs.rmSync(path.join(root, 'CLAUDE.md'));
    fs.rmSync(path.join(root, 'GEMINI.md'));
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /FAIL CLAUDE\.md is missing/.test(l)), lines.join(' | '));
    assert.ok(lines.some((l) => /FAIL GEMINI\.md is missing/.test(l)), lines.join(' | '));
  });

  test('fails when .gitignore is absent', () => {
    fs.rmSync(path.join(root, '.gitignore'));
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /FAIL Missing \.gitignore/.test(l)), lines.join(' | '));
  });
});
