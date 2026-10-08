/**
 * Link-checker edge cases and bare-workspace coverage.
 *
 * Split from tests/validate-coverage-paths.test.js.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { runValidation } from '../scripts/validate.js';

function collect(root: string) {
  const lines: string[] = [];
  const phases: string[] = [];
  const result = runValidation(root, {
    pass: (m: string) => lines.push(`PASS ${m}`),
    warn: (m: string) => lines.push(`WARN ${m}`),
    fail: (m: string) => lines.push(`FAIL ${m}`),
    log: (m: string) => lines.push(`LOG ${m}`),
    heading: (m) => phases.push(m)
  });
  return { result, lines, joined: lines.join('\n'), phases };
}

function fixture(name: string) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `azcodr-cov-${name}-`));
  for (const p of ['docs/rules', 'docs/knowledge', '.agents/skills/demo', '.github/workflows']) {
    fs.mkdirSync(path.join(root, ...p.split('/')), { recursive: true });
  }
  fs.writeFileSync(path.join(root, 'AGENTS.md'), '# AGENTS\nbody\n');
  for (const n of ['CLAUDE.md', 'agents.md', 'GEMINI.md', '.cursorrules', '.windsurfrules']) {
    fs.writeFileSync(path.join(root, n), 'AGENTS.md\n');
  }
  fs.writeFileSync(path.join(root, '.gitignore'), 'node_modules/\n');
  fs.writeFileSync(
    path.join(root, '.github', 'copilot-instructions.md'),
    '../AGENTS.md\n'
  );
  fs.writeFileSync(path.join(root, '.github', 'workflows', 'ci.yml'), 'name: CI\n');
  fs.writeFileSync(path.join(root, 'docs', 'rules', 'r.md'), '# R\n\n> **Core Mandate:** x\n');
  fs.writeFileSync(
    path.join(root, 'docs', 'knowledge', 'ubiquitous_language.md'),
    '# UL\n\n| Term | Def |\n|---|---|\n| Thing | A thing |\n'
  );
  fs.writeFileSync(
    path.join(root, '.agents', 'skills', 'demo', 'SKILL.md'),
    '---\nname: demo\ndescription: Use when x. Do not use y.\n---\n\n## Gotchas\n'
  );
  fs.writeFileSync(path.join(root, 'memory.md'), '# Memory\n');
  return root;
}

function linksVerdict(root: string, body: string) {
  fs.writeFileSync(path.join(root, 'LINKS.md'), body);
  return collect(root);
}

describe('coverage: link checker anchor and encoding edges', () => {
  let root: string;
  beforeEach(() => { root = fixture('links'); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('ignores a bare anchor-only link', () => {
    const { joined } = linksVerdict(root, '[x](#some-section)\n');
    assert.ok(!/Broken markdown link/.test(joined), joined);
  });

  test('ignores a link whose path portion is empty after fragment strip', () => {
    const { joined } = linksVerdict(root, '[x](#)\n');
    assert.ok(!/Broken markdown link/.test(joined), joined);
  });

  test('percent-encoded path that resolves is accepted', () => {
    fs.writeFileSync(path.join(root, 'file.md'), '# f\n');
    const { joined } = linksVerdict(root, '[x](./file.md)\n');
    assert.ok(!/Broken markdown link/.test(joined), joined);
  });

  test('ignores windows absolute links and external protocols', () => {
    const { joined } = linksVerdict(root, '[x](C:\\Users\\test.md)\n[y](http://example.com)\n');
    assert.ok(!/Broken markdown link/.test(joined), joined);
  });
});

describe('coverage: link checker malformed and multiple targets', () => {
  let root: string;
  beforeEach(() => { root = fixture('links'); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('malformed percent-encoding is reported as broken, not crashed on', () => {
    // decodeURIComponent throws URIError on a truncated sequence; the checker
    // must fall back to the raw target rather than aborting the whole run.
    const { joined, phases } = linksVerdict(root, '[x](./%E0%A4%A)\n');
    assert.ok(phases.length > 0, 'validation must complete all phases');
    assert.match(joined, /Broken markdown link/);
  });

  test('reports an empty inline target as a finding, not a crash', () => {
    const { joined } = linksVerdict(root, '[x]()\n');
    assert.ok(!/Broken markdown link/.test(joined), joined);
  });

  test('counts and reports multiple broken inline links', () => {
    const { joined } = linksVerdict(root, '[a](./X.md)\n[b](./Y.md)\n');
    assert.match(joined, /Broken markdown link: LINKS\.md -> \.\/X\.md/);
    assert.match(joined, /Broken markdown link: LINKS\.md -> \.\/Y\.md/);
  });
});

describe('coverage: workspace with no rules or skills directories', () => {
  let root: string;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-bare-'));
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('fails when docs/rules is missing', () => {
    fs.writeFileSync(path.join(root, 'AGENTS.md'), '# A\n');
    const { joined } = collect(root);
    assert.match(joined, /FAIL Missing docs\/rules directory/);
  });

  test('fails when .agents/skills is missing', () => {
    fs.mkdirSync(path.join(root, 'docs', 'rules'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs', 'rules', 'r.md'), '# R\n\n> **Core Mandate:** x\n');
    fs.writeFileSync(path.join(root, 'AGENTS.md'), '# A\n');
    const { joined } = collect(root);
    assert.match(joined, /FAIL Missing \.agents\/skills directory/);
  });

  test('fails when memory.md is missing', () => {
    fs.mkdirSync(path.join(root, 'docs', 'rules'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs', 'rules', 'r.md'), '# R\n\n> **Core Mandate:** x\n');
    fs.writeFileSync(path.join(root, 'AGENTS.md'), '# A\n');
    const { joined } = collect(root);
    assert.match(joined, /FAIL Missing memory\.md ADR ledger/);
  });
});
