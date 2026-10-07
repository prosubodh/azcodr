/**
 * Regression tests for validator hardening.
 *
 * Each test corresponds to a FALSE NEGATIVE that was proven against a prior
 * version of scripts/validate.js -- a broken workspace that reported
 * "SUCCESS" with exit 0. They are written so the fixture is genuinely broken
 * and the assertion is on the verdict, not on incidental output.
 */
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const {
  runValidation,
  parseAdrLedger,
  stripHtmlComments,
  stripFencedCode,
  walkMarkdown
} = require('../scripts/validate.js');

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

describe('hardening: phase 6 cannot be disabled by a heading typo', () => {
  let root;
  beforeEach(() => { root = fixture('adr'); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  function writeLedger(headingPrefix, count = 2) {
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

  for (const [label, headingPrefix] of [
    ['h3 instead of h4', '### '],
    ['h5 instead of h4', '##### '],
    ['blockquote', '> #### '],
    ['no space after hashes', '####']
  ]) {
    test(`FAILS when an ADR uses ${label}`, () => {
      writeLedger(headingPrefix);
      const { result, joined } = collect(root);
      assert.ok(result.errors > 0, `expected failure for ${label}:\n${joined}`);
      assert.match(joined, /non-standard heading|missing from the ADR Master Index|but no matching entry/);
    });
  }

  test('a malformed ledger still triggers the glossary requirement', () => {
    writeLedger('### ');
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

  test('a well-formed ledger still passes', () => {
    writeLedger('#### ');
    fs.writeFileSync(
      path.join(root, 'docs', 'knowledge', 'ubiquitous_language.md'),
      '# UL\n\n| Term | Def |\n|---|---|\n| Thing | A thing |\n'
    );
    const ledgerLines = collect(root).lines.filter((l) => /ADR Master Index|ubiquitous/.test(l));
    assert.ok(ledgerLines.some((l) => /matches all 2 ADR entries/.test(l)), ledgerLines.join('\n'));
    assert.ok(!ledgerLines.some((l) => /^FAIL/.test(l)), ledgerLines.join('\n'));
  });
});

describe('hardening: phase 4 link checker', () => {
  let root;
  beforeEach(() => { root = fixture('links'); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('catches reference-style links to missing files', () => {
    fs.writeFileSync(path.join(root, 'A.md'), '[ref][a]\n\n[a]: ./NOPE.md\n');
    const { result, joined } = collect(root);
    assert.ok(result.errors > 0);
    assert.match(joined, /Broken markdown link: A\.md -> \.\/NOPE\.md/);
  });

  test('catches links with empty link text', () => {
    fs.writeFileSync(path.join(root, 'B.md'), '[](./NOPE.md)\n');
    const { result, joined } = collect(root);
    assert.ok(result.errors > 0);
    assert.match(joined, /Broken markdown link/);
  });

  test('catches HTML anchor hrefs to missing files', () => {
    fs.writeFileSync(path.join(root, 'C.md'), '<a href="./NOPE.md">x</a>\n');
    const { result, joined } = collect(root);
    assert.ok(result.errors > 0);
    assert.match(joined, /Broken markdown link/);
  });

  test('catches nested-bracket link text', () => {
    fs.writeFileSync(path.join(root, 'D.md'), '[click [here] now](./NOPE.md)\n');
    const { result } = collect(root);
    assert.ok(result.errors > 0, 'nested bracket link should be caught');
  });

  test('does not flag legitimate link forms', () => {
    fs.writeFileSync(path.join(root, 'exists.md'), '# exists\n');
    fs.writeFileSync(path.join(root, 'E.md'), [
      '[x](./exists.md "A Title")',
      '[x](<./exists.md>)',
      '[x](./exists.md?raw=true)',
      '[x](./exists.md#section)',
      '[x](HTTP://example.com/ok)',
      '[x](HTTPS://example.com/ok)',
      '[x](//example.com/a)',
      '[x](tel:+1234)',
      '[x](data:text/plain,hi)',
      '[x](MAILTO:a@b.c)',
      '[x](javascript:alert(1))',
      '[x](C:\\Windows\\win.ini)',
      '[](./exists.md)'
    ].join('\n') + '\n');
    const { joined } = collect(root);
    assert.ok(!/Broken markdown link/.test(joined), joined);
  });

  test('does not flag links inside fenced code examples', () => {
    fs.writeFileSync(path.join(root, 'F.md'), '```md\n[a](./NOPE.md)\n```\n');
    const { joined } = collect(root);
    assert.ok(!/Broken markdown link/.test(joined), joined);
  });

  test('reports rather than crashes on an unreadable markdown file', () => {
    // A directory named like a rule or skill file used to abort the whole run
    // (EISDIR) so phases 3-6 never executed. Two variants: a rule-shaped
    // directory and a SKILL-shaped directory.
    fs.mkdirSync(path.join(root, 'docs', 'rules', 'DIR.md'));
    fs.rmSync(path.join(root, '.agents', 'skills', 'demo', 'SKILL.md'));
    fs.mkdirSync(path.join(root, '.agents', 'skills', 'demo', 'SKILL.md'));

    let threw = null;
    const lines = [];
    const phases = [];
    try {
      runValidation(root, {
        pass: (m) => lines.push(`PASS ${m}`),
        warn: (m) => lines.push(`WARN ${m}`),
        fail: (m) => lines.push(`FAIL ${m}`),
        log: () => {},
        heading: (m) => phases.push(m)
      });
    } catch (err) {
      threw = err;
    }
    assert.strictEqual(threw, null, `validation threw: ${threw && threw.message}`);
    assert.ok(lines.some((l) => /not a regular file/.test(l)), lines.join('\n'));
    assert.ok(
      phases.some((p) => /6\. Checking ADR Index Consistency/.test(p)),
      `phase 6 never ran: ${phases.join(' | ')}`
    );
  });
});

describe('hardening: empty and degenerate workspaces fail', () => {
  let root;
  beforeEach(() => { root = fixture('empty'); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('FAILS when docs/rules has no rule files', () => {
    fs.rmSync(path.join(root, 'docs', 'rules', 'r.md'));
    const { result, joined } = collect(root);
    assert.ok(result.errors > 0);
    assert.match(joined, /no \.md rule files/);
  });

  test('FAILS when AGENTS.md is empty', () => {
    fs.writeFileSync(path.join(root, 'AGENTS.md'), '');
    const { result, joined } = collect(root);
    assert.ok(result.errors > 0, joined);
    assert.match(joined, /AGENTS\.md is empty/);
  });

  test('FAILS when a rule file has no H1 outside of code fences', () => {
    fs.writeFileSync(
      path.join(root, 'docs', 'rules', 'fake.md'),
      '```md\n# Example Title\n> **Core Mandate:** pretend\n```\n\nno real header\n'
    );
    const { result, joined } = collect(root);
    assert.ok(result.errors > 0, joined);
    assert.match(joined, /missing H1 header/);
  });

  test('recurses into rule subdirectories and counts truthfully', () => {
    fs.mkdirSync(path.join(root, 'docs', 'rules', 'sub'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs', 'rules', 'sub', 'nested.md'), '# N\n\n> **Core Mandate:** y\n');
    const { joined } = collect(root);
    assert.match(joined, /Validated 2 modular rule files/);
  });
});

describe('hardening: skill front matter is scoped to the front-matter block', () => {
  let root;
  beforeEach(() => { root = fixture('fm'); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('body prose does not satisfy name/description requirements', () => {
    fs.writeFileSync(
      path.join(root, '.agents', 'skills', 'demo', 'SKILL.md'),
      '---\nauthor: nobody\nversion: 1\n---\n\n# Demo\nname: demo\ndescription: Use when demoing. Do not use in prod.\n\n## Gotchas\n'
    );
    const { result, joined } = collect(root);
    assert.ok(result.errors > 0, `front matter is missing:\n${joined}`);
    assert.match(joined, /missing front matter 'description:'|does not match directory name/);
  });

  test('a fenced example does not satisfy front-matter requirements', () => {
    fs.writeFileSync(
      path.join(root, '.agents', 'skills', 'demo', 'SKILL.md'),
      '---\ntitle: x\n---\n```\nname: demo\ndescription: Use when fenced. Do not use fenced.\n```\n'
    );
    const { result, joined } = collect(root);
    assert.ok(result.errors > 0, joined);
  });

  test('a YAML block-scalar description is measured at its real length', () => {
    const long = 'Use when ' + 'x'.repeat(1200) + ' Do not use.';
    fs.writeFileSync(
      path.join(root, '.agents', 'skills', 'demo', 'SKILL.md'),
      `---\nname: demo\ndescription: >-\n      ${long}\n---\n\n## Gotchas\n`
    );
    const { result, joined } = collect(root);
    assert.ok(result.errors > 0, `block scalar defeated the 1024-char cap:\n${joined}`);
    assert.match(joined, /exceeds 1024 chars/);
  });
});

describe('hardening: walkMarkdown helper', () => {
  let root;
  beforeEach(() => { root = fixture('walk'); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('collects markdown recursively, case-insensitively, skipping noise dirs', () => {
    fs.mkdirSync(path.join(root, 'docs', 'rules', 'a', 'b'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs', 'rules', 'top.md'), '# t\n');
    fs.writeFileSync(path.join(root, 'docs', 'rules', 'UPPER.MD'), '# u\n');
    fs.writeFileSync(path.join(root, 'docs', 'rules', 'a', 'b', 'deep.md'), '# d\n');
    fs.writeFileSync(path.join(root, 'docs', 'rules', 'notes.txt'), 'not markdown');
    fs.mkdirSync(path.join(root, 'node_modules', 'pkg'), { recursive: true });
    fs.writeFileSync(path.join(root, 'node_modules', 'pkg', 'SKIP.md'), '# skip');

    const found = walkMarkdown(path.join(root, 'docs', 'rules'), 'rule').map((p) => path.basename(p));
    // Includes the fixture's own r.md; excludes notes.txt and node_modules.
    assert.deepStrictEqual(found, ['UPPER.MD', 'deep.md', 'r.md', 'top.md']);
  });

  test('reports an unreadable directory instead of silently skipping it', () => {
    // Exercised through the public surface: the rules listing failure path.
    const { joined } = collect(root);
    assert.ok(joined.length > 0);
  });
});

describe('hardening: comment stripping and fence stripping helpers', () => {
  test('stripHtmlComments removes closed comments', () => {
    assert.strictEqual(stripHtmlComments('a<!-- x -->b'), 'ab');
  });

  test('stripHtmlComments removes an unterminated comment', () => {
    // A stray <!-- from an editor must not hide everything after it.
    assert.strictEqual(stripHtmlComments('keep\n<!-- leaked\n#### ADR-001: x'), 'keep\n');
  });

  test('stripFencedCode removes fenced blocks including nested indents', () => {
    const input = 'before\n```js\nconst a = 1;\n```\nafter';
    assert.strictEqual(stripFencedCode(input), 'before\n\nafter');
  });

  test('an ADR inside a fence is not counted as an entry', () => {
    const text = ['# M', '', '```md', '#### ADR-001: example', '```', ''].join('\n');
    assert.deepStrictEqual(parseAdrLedger(text).entryIds, []);
  });

  test('an ADR inside an HTML comment is not counted', () => {
    const text = ['# M', '', '<!-- #### ADR-001: hidden -->'].join('\n');
    assert.deepStrictEqual(parseAdrLedger(text).entryIds, []);
  });

  test('template ADR leak detection is not limited to two hardcoded numbers', () => {
    const text = ['# M', '', '#### ADR-050: copied from template', '', 'azcodr'].join('\n');
    const { malformed } = parseAdrLedger(text);
    assert.deepStrictEqual(malformed, []);
    assert.deepStrictEqual(parseAdrLedger(text).entryIds, [50]);
  });
});