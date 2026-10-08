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

describe('harness parity drift: pointer targets', () => {
  let root: string;
  beforeEach(() => { root = baseFixture(); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('fails a parity file pointing at the wrong target', () => {
    fs.writeFileSync(path.join(root, 'CLAUDE.md'), 'README.md\n');
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /FAIL CLAUDE\.md is not a symbolic link/.test(l)), lines.join(' | '));
  });

  test('warns on a byte-identical copy of AGENTS.md (Windows symlink fallback)', () => {
    const content = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf-8');
    fs.writeFileSync(path.join(root, 'CLAUDE.md'), content);
    const { lines } = collect(root);
    assert.ok(
      lines.some((l) => /WARN CLAUDE\.md is a byte-identical copy of AGENTS\.md/.test(l)),
      lines.join(' | ')
    );
  });
});

describe('harness parity drift: github presence', () => {
  let root: string;
  beforeEach(() => { root = baseFixture(); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('warns when copilot-instructions.md is missing but .github exists', () => {
    const gh = path.join(root, '.github');
    fs.mkdirSync(gh, { recursive: true });
    const { lines } = collect(root);
    assert.ok(
      lines.some((l) => /WARN \.github\/copilot-instructions\.md is missing/.test(l)),
      lines.join(' | ')
    );
  });

  test('warns when .github/workflows is missing', () => {
    const gh = path.join(root, '.github');
    fs.mkdirSync(gh, { recursive: true });
    fs.writeFileSync(path.join(gh, 'copilot-instructions.md'), '../AGENTS.md\n');
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /WARN \.github\/workflows is missing/.test(l)), lines.join(' | '));
  });
});

describe('rules directory defects: presence', () => {
  let root: string;
  beforeEach(() => { root = baseFixture(); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('fails when docs/rules is absent', () => {
    fs.rmSync(path.join(root, 'docs', 'rules'), { recursive: true });
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /^FAIL Missing docs\/rules directory/.test(l)), lines.join(' | '));
  });

  test('fails a rule file with no H1 header', () => {
    fs.writeFileSync(path.join(root, 'docs', 'rules', 'bad.md'), 'no header here\n');
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /FAIL Rule bad\.md missing H1 header/.test(l)), lines.join(' | '));
  });
});

describe('rules directory defects: content', () => {
  let root: string;
  beforeEach(() => { root = baseFixture(); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('warns a rule file missing the Core Mandate line', () => {
    fs.writeFileSync(path.join(root, 'docs', 'rules', 'nomad.md'), '# Title\n');
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /WARN Rule nomad\.md missing standardized/.test(l)), lines.join(' | '));
  });

  test('warns a rule file over the 24KB cap', () => {
    fs.writeFileSync(path.join(root, 'docs', 'rules', 'big.md'), '# B\n\n' + 'x'.repeat(24001));
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /WARN Rule big\.md exceeds 24KB/.test(l)), lines.join(' | '));
  });
});
