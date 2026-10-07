const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { runValidation, parseAdrLedger } = require('../scripts/validate.js');

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

function writePopulatedGlossary(rootDir) {
  const dir = path.join(rootDir, 'docs', 'knowledge');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'ubiquitous_language.md'),
    [
      '# Ubiquitous Language',
      '',
      '| Canonical Term | Business Definition | Bounded Context | Forbidden Synonyms | Identifiers |',
      '|---|---|---|---|---|',
      '| Scaffold | Materialise a template into a target workspace | Scaffolding | template, skeleton | scaffold() |'
    ].join('\n')
  );
}

describe('parseAdrLedger extracts entries and index rows', () => {
  test('reads both index rows and entry headings', () => {
    const text = ledgerWith(
      ['| ADR-001 | First thing | 2026-10-01 | ACCEPTED | clean_code.md |'],
      '#### ADR-001: First thing\n- **Date:** 2026-10-01'
    );
    const { entryIds, indexIds } = parseAdrLedger(text);
    assert.deepStrictEqual(entryIds, [1]);
    assert.deepStrictEqual(indexIds, [1]);
  });

  test('ignores ADRs inside HTML comments', () => {
    const text = ['# Memory', '', '<!-- #### ADR-009: hidden -->'].join('\n');
    assert.deepStrictEqual(parseAdrLedger(text).entryIds, []);
  });

  test('treats an untouched template index as having no ADR rows', () => {
    const text = [
      '# Memory',
      '',
      '| ID | Title |',
      '|---|---|',
      '| *(No decisions recorded yet)* | *Record during /lets-build.* |'
    ].join('\n');
    assert.deepStrictEqual(parseAdrLedger(text).indexIds, []);
  });
});

describe('ADR Master Index drift: clean slate', () => {
  let root;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-adr-'));
    fs.writeFileSync(path.join(root, 'AGENTS.md'), '# A\n');
    fs.writeFileSync(path.join(root, 'memory.md'), '# Memory\n');
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('a clean slate stays clean (no ADR, no cross-check)', () => {
    const { lines } = collect(root);
    assert.ok(!lines.some((l) => /Master Index/.test(l)), lines.join(' | '));
  });
});

describe('ADR Master Index drift: entry missing from index', () => {
  let root;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-adr-'));
    fs.writeFileSync(path.join(root, 'AGENTS.md'), '# A\n');
    fs.writeFileSync(path.join(root, 'memory.md'), '# Memory\n');
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('FAILS when an ADR entry is missing from the index table', () => {
    fs.writeFileSync(
      path.join(root, 'memory.md'),
      ledgerWith([], '#### ADR-001: Chose a stack\n- **Date:** 2026-10-07')
    );
    const { lines, result } = collect(root);
    assert.ok(
      lines.some((l) => /FAIL ADR-001 exists in memory\.md but is missing from the ADR Master Index table/.test(l)),
      lines.join(' | ')
    );
    assert.ok(result.errors > 0);
  });
});

describe('ADR Master Index drift: phantom index row', () => {
  let root;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-adr-'));
    fs.writeFileSync(path.join(root, 'AGENTS.md'), '# A\n');
    fs.writeFileSync(path.join(root, 'memory.md'), '# Memory\n');
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('FAILS when the index advertises an ADR with no entry', () => {
    fs.writeFileSync(
      path.join(root, 'memory.md'),
      ledgerWith(
        ['| ADR-004 | Phantom decision | 2026-10-02 | ACCEPTED | clean_code.md |'],
        '#### ADR-001: Real decision\n- **Date:** 2026-10-07'
      )
    );
    const { lines } = collect(root);
    assert.ok(
      lines.some((l) => /FAIL ADR Master Index lists ADR-004 but no matching entry exists/.test(l)),
      lines.join(' | ')
    );
  });
});

describe('ADR Master Index drift: healthy ledger', () => {
  let root;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-adr-'));
    fs.writeFileSync(path.join(root, 'AGENTS.md'), '# A\n');
    fs.writeFileSync(path.join(root, 'memory.md'), '# Memory\n');
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('PASSES when index and entries agree (the healthy case)', () => {
    writePopulatedGlossary(root);
    fs.writeFileSync(
      path.join(root, 'memory.md'),
      ledgerWith(
        [
          '| ADR-001 | First thing | 2026-10-01 | ACCEPTED | clean_code.md |',
          '| ADR-002 | Second thing | 2026-10-02 | ACCEPTED | type_safety.md |'
        ],
        '#### ADR-001: First thing\n- **Date:** 2026-10-01\n\n#### ADR-002: Second thing\n- **Date:** 2026-10-02'
      )
    );
    const { ledgerLines, ledgerFailures } = collectLedgerOnly(root);
    assert.ok(
      ledgerLines.some((l) => /PASS ADR Master Index matches all 2 ADR entries/.test(l)),
      ledgerLines.join(' | ')
    );
    assert.deepStrictEqual(ledgerFailures, []);
  });
});

describe('ADR Master Index drift: scale', () => {
  let root;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-adr-'));
    fs.writeFileSync(path.join(root, 'AGENTS.md'), '# A\n');
    fs.writeFileSync(path.join(root, 'memory.md'), '# Memory\n');
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('detects drift at scale (index says 1, ledger has 9)', () => {
    const entries = Array.from({ length: 9 }, (_, i) => `#### ADR-00${i + 1}: Decision ${i + 1}`).join('\n\n');
    fs.writeFileSync(
      path.join(root, 'memory.md'),
      ledgerWith(['| ADR-001 | Decision 1 | 2026-10-01 | ACCEPTED | clean_code.md |'], entries)
    );
    const { lines } = collect(root);
    for (const n of [2, 3, 4, 5, 6, 7, 8, 9]) {
      assert.ok(
        lines.some((l) => new RegExp(`FAIL ADR-00${n} exists in memory\\.md but is missing`).test(l)),
        `expected ADR-00${n} drift to be reported: ${lines.join(' | ')}`
      );
    }
  });
});
