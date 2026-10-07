/**
 * The ledger-fitness regressions this file guards were both found in real
 * sibling repos:
 *   - stirling-engine: 9 accepted ADRs, index still "No decisions recorded yet",
 *     validator reported SUCCESS.
 *   - azcodr glossary: empty vocabulary table alongside a documented DDD
 *     governance layer.
 */
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

/**
 * Phase 1-4 failures are noise for these tests, which assert only on the
 * phase-6 ledger and glossary outcomes. Suppress every other reported problem
 * so `result.errors` is meaningful.
 */
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

describe('break: parseAdrLedger extracts entries and index rows', () => {
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

describe('break: ADR Master Index drift', () => {
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

function silentReporter() {
  return { pass: () => {}, warn: () => {}, fail: () => {}, log: () => {}, heading: () => {} };
}

describe('break: self-healing must never overwrite AGENTS.md', () => {
  // Live regression. The parity repair path writes agents.md when the listing
  // lacks it. On a case-insensitive filesystem (Windows/macOS) `agents.md` and
  // `AGENTS.md` are the SAME file, so an unguarded write replaces AGENTS.md
  // with the 10-byte string "AGENTS.md" — destroying the file the validator is
  // supposed to protect. Caught by running the real validator on this repo.
  let root;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-clobber-'));
    fs.writeFileSync(path.join(root, 'AGENTS.md'), '# Real Content\n\nbody\n');
    fs.writeFileSync(path.join(root, 'CLAUDE.md'), 'AGENTS.md\n');
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('leaves AGENTS.md byte-identical when the lower-case path already resolves to it', () => {
    const before = fs.readFileSync(path.join(root, 'AGENTS.md'));
    runValidation(root, silentReporter());
    const after = fs.readFileSync(path.join(root, 'AGENTS.md'));
    assert.ok(before.equals(after), 'AGENTS.md was modified by the parity repair');
    assert.ok(after.length > 20, 'AGENTS.md looks replaced by a pointer stub');
  });

  test('reports the case-insensitive satisfaction rather than repairing', () => {
    const { lines } = collect(root);
    assert.ok(
      lines.some((l) => /agents\.md is satisfied natively by AGENTS\.md/.test(l)),
      lines.join(' | ')
    );
  });
});

describe('break: ubiquitous language glossary must not stay empty', () => {
  let root;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-gloss-'));
    fs.writeFileSync(path.join(root, 'AGENTS.md'), '# A\n');
    fs.writeFileSync(
      path.join(root, 'memory.md'),
      ledgerWith(
        ['| ADR-001 | First thing | 2026-10-01 | ACCEPTED | clean_code.md |'],
        '#### ADR-001: First thing\n- **Date:** 2026-10-01'
      )
    );
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  function writeGlossary(body) {
    const dir = path.join(root, 'docs', 'knowledge');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'ubiquitous_language.md'), body);
  }

  test('FAILS when the glossary file is missing entirely', () => {
    const { lines } = collect(root);
    assert.ok(
      lines.some((l) => /FAIL Missing docs\/knowledge\/ubiquitous_language\.md/.test(l)),
      lines.join(' | ')
    );
  });

  test('FAILS when the glossary is still the untouched template', () => {
    writeGlossary([
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

  test('PASSES once at least one real term is defined', () => {
    writeGlossary([
      '# Ubiquitous Language',
      '',
      '| Canonical Term | Business Definition | Bounded Context | Forbidden Synonyms | Identifiers |',
      '|---|---|---|---|---|',
      '| Scaffold | Materialise a template into a target workspace | Scaffolding | template, skeleton | scaffold() |'
    ].join('\n'));
    const { ledgerLines, ledgerFailures } = collectLedgerOnly(root);
    assert.deepStrictEqual(ledgerFailures, [], ledgerLines.join(' | '));
  });

  test('honours an explicit template waiver with a documented reason', () => {
    // The template repo's glossary ships downstream blank on purpose; the
    // waiver is greppable rather than a hardcoded exemption in the validator.
    const dir = path.join(root, 'docs', 'knowledge');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'ubiquitous_language.md'),
      [
        '# Ubiquitous Language',
        '',
        '| Canonical Term | Definition | Context | Synonyms | Identifiers |',
        '|---|---|---|---|---|',
        '| *(No domain terms defined yet)* | *later* | | | |',
        '',
        '<!-- azcodr:glossary-waived -->'
      ].join('\n')
    );
    const { ledgerLines } = collectLedgerOnly(root);
    assert.ok(
      !ledgerLines.some((l) => /^FAIL/.test(l) && /ubiquitous_language/.test(l)),
      ledgerLines.join(' | ')
    );
  });

test('warns when the waiver marker leaks into a scaffolded project', () => {
    const dir = path.join(root, 'docs', 'knowledge');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'ubiquitous_language.md'),
      [
        '# Ubiquitous Language',
        '',
        '| Canonical Term | Definition | Context | Synonyms | Identifiers |',
        '|---|---|---|---|---|',
        '| *(No domain terms defined yet)* | *later* | | | |',
        '',
        '<!-- azcodr:glossary-waived -->'
      ].join('\n')
    );
    // A non-"azcodr" root is treated as a downstream project.
    fs.renameSync(root, `${root}-scaffolded`);
    try {
      const renamed = `${root}-scaffolded`;
      const { ledgerLines } = collectLedgerOnly(renamed);
      assert.ok(
        ledgerLines.some((l) => /WARN ubiquitous_language\.md carries the azcodr template waiver/.test(l)),
        ledgerLines.join(' | ')
      );
    } finally {
      fs.rmSync(`${root}-scaffolded`, { recursive: true, force: true });
    }
  });

test('honours the waiver without warning when the root IS the template repo', () => {
    // Covers the template path: a root literally named "azcodr" gets a clean
    // pass, while any other root name is treated as downstream and warned.
    const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-self-'));
    const templateRoot = path.join(parent, 'azcodr');
    fs.mkdirSync(templateRoot, { recursive: true });
    try {
      fs.writeFileSync(
        path.join(templateRoot, 'memory.md'),
        ledgerWith(
          ['| ADR-001 | First thing | 2026-10-01 | ACCEPTED | clean_code.md |'],
          '#### ADR-001: First thing\n- **Date:** 2026-10-01'
        )
      );
      const dir = path.join(templateRoot, 'docs', 'knowledge');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, 'ubiquitous_language.md'),
        [
          '# Ubiquitous Language',
          '',
          '| Canonical Term | Definition | Context | Synonyms | Identifiers |',
          '|---|---|---|---|---|',
          '| *(No domain terms defined yet)* | *later* | | | |',
          '',
          '<!-- azcodr:glossary-waived -->'
        ].join('\n')
      );
      const { ledgerLines, ledgerFailures } = collectLedgerOnly(templateRoot);
      assert.deepStrictEqual(ledgerFailures, [], ledgerLines.join(' | '));
      assert.ok(
        ledgerLines.some((l) => /PASS ubiquitous_language\.md is intentionally blank/.test(l)),
        ledgerLines.join(' | ')
      );
    } finally {
      fs.rmSync(parent, { recursive: true, force: true });
    }
  });

test('does not demand a glossary on a clean slate', () => {
    fs.writeFileSync(path.join(root, 'memory.md'), '# Memory\n\nno adrs\n');
    const { lines } = collect(root);
    assert.ok(!lines.some((l) => /ubiquitous_language/.test(l)), lines.join(' | '));
  });
});