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

describe('skills front-matter: presence', () => {
  let root: string;
  let skillFile: string;
  beforeEach(() => {
    root = baseFixture();
    skillFile = path.join(root, '.agents', 'skills', 'demo', 'SKILL.md');
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('fails when .agents/skills is absent', () => {
    fs.rmSync(path.join(root, '.agents'), { recursive: true });
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /^FAIL Missing \.agents\/skills directory/.test(l)), lines.join(' | '));
  });

  test('fails a skill folder with no SKILL.md', () => {
    fs.rmSync(skillFile);
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /FAIL Skill 'demo' missing SKILL\.md/.test(l)), lines.join(' | '));
  });
});

describe('skills front-matter: delimiters', () => {
  let root: string;
  let skillFile: string;
  beforeEach(() => {
    root = baseFixture();
    skillFile = path.join(root, '.agents', 'skills', 'demo', 'SKILL.md');
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('fails when the opening front-matter delimiter is absent', () => {
    fs.writeFileSync(skillFile, 'name: demo\ndescription: Use when x. Do not use y.\n');
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /missing opening front matter delimiter/.test(l)), lines.join(' | '));
  });

  test('fails when the closing front-matter delimiter is absent', () => {
    fs.writeFileSync(skillFile, '---\nname: demo\ndescription: Use when x. Do not use y.\n');
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /missing closing front matter delimiter/.test(l)), lines.join(' | '));
  });
});

describe('skills front-matter: name and description', () => {
  let root: string;
  let skillFile: string;
  beforeEach(() => {
    root = baseFixture();
    skillFile = path.join(root, '.agents', 'skills', 'demo', 'SKILL.md');
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('fails when front-matter name does not match the directory', () => {
    fs.writeFileSync(skillFile, '---\nname: wrong\ndescription: Use when x. Do not use y.\n---\n\n## Gotchas\n');
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /front matter 'name:' does not match directory name/.test(l)), lines.join(' | '));
  });

  test('fails a missing description', () => {
    fs.writeFileSync(skillFile, '---\nname: demo\n---\n\n## Gotchas\n');
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /missing front matter 'description:'/.test(l)), lines.join(' | '));
  });
});

describe('skills front-matter: description style', () => {
  let root: string;
  let skillFile: string;
  beforeEach(() => {
    root = baseFixture();
    skillFile = path.join(root, '.agents', 'skills', 'demo', 'SKILL.md');
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('warns a description not starting with "Use when"', () => {
    fs.writeFileSync(skillFile, '---\nname: demo\ndescription: Helps with x. Do not use in prod.\n---\n\n## Gotchas\n');
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /should start with imperative 'Use when/.test(l)), lines.join(' | '));
  });

  test('warns a description with no negative boundary', () => {
    fs.writeFileSync(skillFile, '---\nname: demo\ndescription: Use when testing things.\n---\n\n## Gotchas\n');
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /should specify negative boundaries/.test(l)), lines.join(' | '));
  });
});

describe('skills front-matter: size limits', () => {
  let root: string;
  let skillFile: string;
  beforeEach(() => {
    root = baseFixture();
    skillFile = path.join(root, '.agents', 'skills', 'demo', 'SKILL.md');
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('fails a description over 1024 chars', () => {
    const desc = 'Use when ' + 'a'.repeat(1100) + ' Do not use.';
    fs.writeFileSync(skillFile, `---\nname: demo\ndescription: ${desc}\n---\n\n## Gotchas\n`);
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /exceeds 1024 chars/.test(l)), lines.join(' | '));
  });

  test('warns a SKILL.md over 500 lines', () => {
    const body = '---\nname: demo\ndescription: Use when x. Do not use y.\n---\n\n' + 'line\n'.repeat(520);
    fs.writeFileSync(skillFile, body);
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /exceeds 500 lines/.test(l)), lines.join(' | '));
  });

  test('warns a SKILL.md missing the Gotchas section', () => {
    fs.writeFileSync(skillFile, '---\nname: demo\ndescription: Use when x. Do not use y.\n---\n\n# Demo\n');
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /missing mandatory 'Gotchas & What NOT to Do' section/.test(l)), lines.join(' | '));
  });
});

describe('markdown link integrity', () => {
  let root: string;
  beforeEach(() => { root = baseFixture(); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('fails a broken relative link and names the source file', () => {
    fs.writeFileSync(path.join(root, 'NOTES.md'), 'See [gone](./missing.md).\n');
    const { lines, result } = collect(root);
    assert.ok(lines.some((l) => /FAIL Broken markdown link: NOTES\.md -> \.\/missing\.md/.test(l)), lines.join(' | '));
    assert.deepStrictEqual(result.brokenLinks, ['NOTES.md -> ./missing.md']);
  });

  test('ignores external, mailto, anchor and fragment-only targets', () => {
    fs.writeFileSync(
      path.join(root, 'NOTES.md'),
      '[a](https://x.com) [b](http://x.com) [c](mailto:a@b.c) [d](#frag) [e](./docs/rules/r.md#sec)\n'
    );
    const { result } = collect(root);
    assert.strictEqual(result.brokenLinks.length, 0);
    assert.strictEqual(result.totalLinks, 1);
  });

  test('does not descend into .git or node_modules', () => {
    const junk = path.join(root, 'node_modules', 'pkg');
    fs.mkdirSync(junk, { recursive: true });
    fs.writeFileSync(path.join(junk, 'BAD.md'), '[x](./nope.md)\n');
    const { result } = collect(root);
    assert.strictEqual(result.brokenLinks.length, 0);
  });
});

describe('memory.md ADR ledger: presence', () => {
  let root: string;
  beforeEach(() => { root = baseFixture(); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('fails when memory.md is absent', () => {
    fs.rmSync(path.join(root, 'memory.md'));
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /FAIL Missing memory\.md ADR ledger/.test(l)), lines.join(' | '));
  });

  test('fails when memory.md has no H1', () => {
    fs.writeFileSync(path.join(root, 'memory.md'), 'no heading\n');
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /FAIL memory\.md missing H1 header/.test(l)), lines.join(' | '));
  });

  test('passes a clean slate with no ADRs', () => {
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /PASS memory\.md is a clean slate/.test(l)), lines.join(' | '));
  });
});

describe('memory.md ADR ledger: entries', () => {
  let root: string;
  beforeEach(() => { root = baseFixture(); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('passes when ADR entries are present', () => {
    fs.writeFileSync(
      path.join(root, 'memory.md'),
      '# Memory\n\n#### ADR-001: Do a thing\n- **Date:** 2026-10-07\n'
    );
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /PASS memory\.md contains ADR entries/.test(l)), lines.join(' | '));
  });

  test('ignores ADRs inside HTML comments when deciding clean slate', () => {
    fs.writeFileSync(path.join(root, 'memory.md'), '# Memory\n\n<!-- #### ADR-001: hidden -->\n');
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /PASS memory\.md is a clean slate/.test(l)), lines.join(' | '));
  });

  test('warns on template-internal ADR numbering leaking into a fresh project', () => {
    fs.writeFileSync(
      path.join(root, 'memory.md'),
      '# Memory\n\n#### ADR-025: leaked from template\n\nazcodr\n'
    );
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /WARN memory\.md may contain template-internal ADRs/.test(l)), lines.join(' | '));
  });
});
