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

function silentReporter() {
  return { pass: () => {}, warn: () => {}, fail: () => {}, log: () => {}, heading: () => {} };
}

function writeWaivedGlossary(dir) {
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
}

function populateTemplateRepo(templateRoot) {
  fs.writeFileSync(
    path.join(templateRoot, 'memory.md'),
    ledgerWith(
      ['| ADR-001 | First thing | 2026-10-01 | ACCEPTED | clean_code.md |'],
      '#### ADR-001: First thing\n- **Date:** 2026-10-01'
    )
  );
  writeWaivedGlossary(path.join(templateRoot, 'docs', 'knowledge'));
}

describe('self-healing must never overwrite AGENTS.md', () => {
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

describe('template waiver: explicit opt-out', () => {
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

  test('honours an explicit template waiver with a documented reason', () => {
    writeWaivedGlossary(path.join(root, 'docs', 'knowledge'));
    const { ledgerLines } = collectLedgerOnly(root);
    assert.ok(
      !ledgerLines.some((l) => /^FAIL/.test(l) && /ubiquitous_language/.test(l)),
      ledgerLines.join(' | ')
    );
  });
});

describe('template waiver: downstream leak', () => {
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

  test('warns when the waiver marker leaks into a scaffolded project', () => {
    writeWaivedGlossary(path.join(root, 'docs', 'knowledge'));
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
});

describe('template waiver: template repo itself', () => {
  test('honours the waiver without warning when the root IS the template repo', () => {
    const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-self-'));
    const templateRoot = path.join(parent, 'azcodr');
    fs.mkdirSync(templateRoot, { recursive: true });
    try {
      populateTemplateRepo(templateRoot);
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
});
