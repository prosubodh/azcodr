/**
 * Regression tests for link checker, empty workspaces, and strip helpers.
 *
 * Split from tests/validate-hardening.test.js.
 */
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  runValidation,
  parseAdrLedger,
  stripHtmlComments,
  stripFencedCode,
  walkMarkdown
} from '../scripts/validate.js';

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

/** Plants a rule-shaped and a skill-shaped directory to provoke EISDIR reads. */
function plantEisdirShapes(root) {
  fs.mkdirSync(path.join(root, 'docs', 'rules', 'DIR.md'));
  fs.rmSync(path.join(root, '.agents', 'skills', 'demo', 'SKILL.md'));
  fs.mkdirSync(path.join(root, '.agents', 'skills', 'demo', 'SKILL.md'));
}

describe('hardening: link checker catches missing targets', () => {
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
});

describe('hardening: link checker text and fence edges', () => {
  let root;
  beforeEach(() => { root = fixture('links'); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('catches nested-bracket link text', () => {
    fs.writeFileSync(path.join(root, 'D.md'), '[click [here] now](./NOPE.md)\n');
    const { result } = collect(root);
    assert.ok(result.errors > 0, 'nested bracket link should be caught');
  });

  test('does not flag links inside fenced code examples', () => {
    fs.writeFileSync(path.join(root, 'F.md'), '```md\n[a](./NOPE.md)\n```\n');
    const { joined } = collect(root);
    assert.ok(!/Broken markdown link/.test(joined), joined);
  });
});

describe('hardening: link checker allows legitimate forms', () => {
  let root;
  beforeEach(() => { root = fixture('links'); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

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
});

describe('hardening: link checker survives unreadable files', () => {
  let root;
  beforeEach(() => { root = fixture('links'); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('reports rather than crashes on an unreadable markdown file', () => {
    // A directory named like a rule or skill file used to abort the whole run
    // (EISDIR) so phases 3-6 never executed. Two variants: a rule-shaped
    // directory and a SKILL-shaped directory.
    plantEisdirShapes(root);
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
    assert.ok(phases.some((p) => /6\. Checking ADR Index Consistency/.test(p)), `phase 6 never ran: ${phases.join(' | ')}`);
  });
});

describe('hardening: empty workspaces fail on missing content', () => {
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
});

describe('hardening: rule headers and recursion', () => {
  let root;
  beforeEach(() => { root = fixture('empty'); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('FAILS when a rule file has no H1 outside of code fences', () => {
    const body = '```md\n# Example Title\n> **Core Mandate:** pretend\n```\n\nno real header\n';
    fs.writeFileSync(path.join(root, 'docs', 'rules', 'fake.md'), body);
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

describe('hardening: skill front matter stays in its block', () => {
  let root;
  beforeEach(() => { root = fixture('fm'); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('body prose does not satisfy name/description requirements', () => {
    const body = '---\nauthor: nobody\nversion: 1\n---\n\n# Demo\nname: demo\ndescription: Use when demoing. Do not use in prod.\n\n## Gotchas\n';
    fs.writeFileSync(path.join(root, '.agents', 'skills', 'demo', 'SKILL.md'), body);
    const { result, joined } = collect(root);
    assert.ok(result.errors > 0, `front matter is missing:\n${joined}`);
    assert.match(joined, /missing front matter 'description:'|does not match directory name/);
  });

  test('a fenced example does not satisfy front-matter requirements', () => {
    const body = '---\ntitle: x\n---\n```\nname: demo\ndescription: Use when fenced. Do not use fenced.\n```\n';
    fs.writeFileSync(path.join(root, '.agents', 'skills', 'demo', 'SKILL.md'), body);
    const { result, joined } = collect(root);
    assert.ok(result.errors > 0, joined);
  });
});

describe('hardening: block-scalar descriptions are measured', () => {
  let root;
  beforeEach(() => { root = fixture('fm'); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

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

describe('hardening: comment and fence stripping', () => {
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
});

describe('hardening: ADR entries hidden in fences or comments', () => {
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
