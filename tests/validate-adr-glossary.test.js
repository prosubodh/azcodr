const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { runValidation } = require('../scripts/validate.js');

function collect(root) {
  const lines = [];
  const reporter = {
    pass: (msg) => lines.push(`PASS ${msg}`),
    warn: (msg) => lines.push(`WARN ${msg}`),
    fail: (msg) => lines.push(`FAIL ${msg}`),
    log: () => {},
    heading: () => {}
  };
  return { result: runValidation(root, reporter), lines };
}

const INDEX_HEAD = [
  '| ID | Title | Date | Status | Governing Rule |',
  '|---|---|---|---|---|'
].join('\n');

function ledgerWith(rows, entries) {
  return ['# Workspace Memory', '', INDEX_HEAD, ...rows, '', entries].join('\n');
}

function collectLedgerOnly(root) {
  const lines = [];
  const reporter = {
    pass: (msg) => lines.push(`PASS ${msg}`),
    warn: (msg) => lines.push(`WARN ${msg}`),
    fail: (msg) => lines.push(`FAIL ${msg}`),
    log: () => {},
    heading: () => {}
  };
  runValidation(root, reporter);
  const ledgerLines = lines.filter((l) => /ADR Master Index|ubiquitous_language/.test(l));
  return {
    ledgerLines,
    ledgerFailures: ledgerLines.filter((l) => /^FAIL/.test(l))
  };
}

function writeGlossary(root, body) {
  const dir = path.join(root, 'docs', 'knowledge');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'ubiquitous_language.md'), body);
}

function seedAdrRoot(root) {
  fs.writeFileSync(path.join(root, 'AGENTS.md'), '# A\n');
  fs.writeFileSync(
    path.join(root, 'memory.md'),
    ledgerWith(
      ['| ADR-001 | First thing | 2026-10-01 | ACCEPTED | clean_code.md |'],
      '#### ADR-001: First thing\n- **Date:** 2026-10-01'
    )
  );
}

describe('glossary: missing or template', () => {
  let root;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-gloss-'));
    seedAdrRoot(root);
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('FAILS when the glossary file is missing entirely', () => {
    const { lines } = collect(root);
    assert.ok(
      lines.some((l) => /FAIL Missing docs\/knowledge\/ubiquitous_language\.md/.test(l)),
      lines.join(' | ')
    );
  });

  test('FAILS when the glossary is still the untouched template', () => {
    writeGlossary(root, [
      '# Ubiquitous Language',
      '',
      '| Canonical Term | Business Definition | Bounded Context | Forbidden Synonyms | Identifiers |',
      '|---|---|---|---|---|',
      '| *(No domain terms defined yet)* | *Define during Phase 1 Domain Discovery.* | | | |'
    ].join('\n'));
    const { ledgerLines } = collectLedgerOnly(root);
    assert.ok(
      ledgerLines.some((l) => /FAIL ubiquitous_language\.md has no domain terms/.test(l)),
      ledgerLines.join(' | ')
    );
  });
});

describe('glossary: populated term', () => {
  let root;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-gloss-'));
    seedAdrRoot(root);
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('PASSES once at least one real term is defined', () => {
    writeGlossary(root, [
      '# Ubiquitous Language',
      '',
      '| Canonical Term | Business Definition | Bounded Context | Forbidden Synonyms | Identifiers |',
      '|---|---|---|---|---|',
      '| Scaffold | Materialise a template into a target workspace | Scaffolding | template, skeleton | scaffold() |'
    ].join('\n'));
    const { ledgerLines, ledgerFailures } = collectLedgerOnly(root);
    assert.deepStrictEqual(ledgerFailures, [], ledgerLines.join(' | '));
  });
});

describe('glossary: clean slate', () => {
  let root;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-gloss-'));
    seedAdrRoot(root);
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('does not demand a glossary on a clean slate', () => {
    fs.writeFileSync(path.join(root, 'memory.md'), '# Memory\n\nno adrs\n');
    const { lines } = collect(root);
    assert.ok(!lines.some((l) => /ubiquitous_language/.test(l)), lines.join(' | '));
  });
});
