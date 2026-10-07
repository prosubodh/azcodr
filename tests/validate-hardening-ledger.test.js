/**
 * Regression tests for ADR ledger hardening (phase 6).
 *
 * Split from tests/validate-hardening.test.js: a heading typo must not be
 * able to disable phase 6.
 */
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { runValidation } from '../scripts/validate.js';

function collect(root) {
  const lines = [];
  const result = runValidation(root, {
    pass: (m) => lines.push(`PASS ${m}`),
    warn: (m) => lines.push(`WARN ${m}`),
    fail: (m) => lines.push(`FAIL ${m}`),
    log: () => {},
    heading: () => {}
  });
  return { result, lines, joined: lines.join('\n') };
}

function fixture(name) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `azcodr-hard-${name}-`));
  for (const p of ['docs/rules', 'docs/knowledge', '.agents/skills/demo']) {
    fs.mkdirSync(path.join(root, ...p.split('/')), { recursive: true });
  }
  fs.writeFileSync(path.join(root, 'AGENTS.md'), '# AGENTS\n');
  for (const n of ['CLAUDE.md', 'agents.md', 'GEMINI.md', '.cursorrules', '.windsurfrules']) {
    fs.writeFileSync(path.join(root, n), 'AGENTS.md\n');
  }
  fs.writeFileSync(path.join(root, '.gitignore'), 'node_modules/\n');
  fs.writeFileSync(path.join(root, 'docs', 'rules', 'r.md'), '# R\n\n> **Core Mandate:** x\n');
  fs.writeFileSync(
    path.join(root, '.agents', 'skills', 'demo', 'SKILL.md'),
    '---\nname: demo\ndescription: Use when x. Do not use y.\n---\n\n## Gotchas\n'
  );
  fs.writeFileSync(
    path.join(root, 'docs', 'knowledge', 'ubiquitous_language.md'),
    '# UL\n\n| Term | Def |\n|---|---|\n| Thing | A thing |\n'
  );
  fs.writeFileSync(path.join(root, 'memory.md'), '# Memory\n');
  return root;
}

function writeLedger(root, headingPrefix, count = 2) {
  const rows = [];
  const entries = [];
  for (let i = 1; i <= count; i += 1) {
    rows.push(`| ADR-00${i} | Decision ${i} |`);
    entries.push(`${headingPrefix}ADR-00${i}: Decision ${i}`);
  }
  fs.writeFileSync(path.join(root, 'memory.md'), [
    '# Memory',
    '',
    '| ID | Title |',
    '|---|---|',
    ...rows,
    '',
    entries.join('\n')
  ].join('\n'));
}

describe('hardening: phase 6 rejects wrong heading levels', () => {
  let root;
  beforeEach(() => { root = fixture('adr'); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  for (const [label, headingPrefix] of [['h3 instead of h4', '### '], ['h5 instead of h4', '##### ']]) {
    test(`FAILS when an ADR uses ${label}`, () => {
      writeLedger(root, headingPrefix);
      const { result, joined } = collect(root);
      assert.ok(result.errors > 0, `expected failure for ${label}:\n${joined}`);
      assert.match(joined, /non-standard heading|missing from the ADR Master Index|but no matching entry/);
    });
  }
});

describe('hardening: phase 6 rejects disguised headings', () => {
  let root;
  beforeEach(() => { root = fixture('adr'); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  for (const [label, headingPrefix] of [['blockquote', '> #### '], ['no space after hashes', '####']]) {
    test(`FAILS when an ADR uses ${label}`, () => {
      writeLedger(root, headingPrefix);
      const { result, joined } = collect(root);
      assert.ok(result.errors > 0, `expected failure for ${label}:\n${joined}`);
      assert.match(joined, /non-standard heading|missing from the ADR Master Index|but no matching entry/);
    });
  }
});

describe('hardening: malformed and duplicate ledgers fail', () => {
  let root;
  beforeEach(() => { root = fixture('adr'); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('a malformed ledger still triggers the glossary requirement', () => {
    writeLedger(root, '### ');
    fs.rmSync(path.join(root, 'docs', 'knowledge', 'ubiquitous_language.md'));
    const { result, joined } = collect(root);
    assert.ok(result.errors > 0);
    assert.match(joined, /ubiquitous_language\.md \(required once ADRs exist\)/);
  });

  test('FAILS on duplicate ADR headings', () => {
    fs.writeFileSync(path.join(root, 'memory.md'), [
      '# Memory', '',
      '| ID | Title |', '|---|---|', '| ADR-001 | One |', '',
      '#### ADR-001: One', '', '#### ADR-001: Again'
    ].join('\n'));
    const { result, joined } = collect(root);
    assert.ok(result.errors > 0, joined);
    assert.match(joined, /more than one entry heading/);
  });
});

describe('hardening: a well-formed ledger still passes', () => {
  let root;
  beforeEach(() => { root = fixture('adr'); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('a well-formed ledger still passes', () => {
    writeLedger(root, '#### ');
    fs.writeFileSync(
      path.join(root, 'docs', 'knowledge', 'ubiquitous_language.md'),
      '# UL\n\n| Term | Def |\n|---|---|\n| Thing | A thing |\n'
    );
    const ledgerLines = collect(root).lines.filter((l) => /ADR Master Index|ubiquitous/.test(l));
    assert.ok(ledgerLines.some((l) => /matches all 2 ADR entries/.test(l)), ledgerLines.join('\n'));
    assert.ok(!ledgerLines.some((l) => /^FAIL/.test(l)), ledgerLines.join('\n'));
  });
});
