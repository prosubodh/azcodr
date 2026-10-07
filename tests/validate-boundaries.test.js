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

/**
 * Builds a file whose `split('\n').length` is exactly `n`, which is how the
 * validator counts. (Naive trailing-newline padding is off by one.)
 */
function agentsMdWithLines(n) {
  return new Array(n).fill('line').join('\n');
}

describe('break: AGENTS.md line budget boundaries (120 warn / 150 fail)', () => {
  let root;
  beforeEach(() => { root = baseFixture(); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('120 lines passes the lean budget', () => {
    fs.writeFileSync(path.join(root, 'AGENTS.md'), agentsMdWithLines(120));
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /AGENTS\.md line count is lean: 120 lines/.test(l)), lines.join(' | '));
    assert.ok(!lines.some((l) => /^FAIL AGENTS\.md line count/.test(l)));
  });

  test('121 lines warns (crosses the warn threshold)', () => {
    fs.writeFileSync(path.join(root, 'AGENTS.md'), agentsMdWithLines(121));
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /WARN AGENTS\.md line count is getting large: 121 lines/.test(l)), lines.join(' | '));
    assert.ok(!lines.some((l) => /^FAIL AGENTS\.md line count/.test(l)));
  });

  test('150 lines warns but does not fail', () => {
    fs.writeFileSync(path.join(root, 'AGENTS.md'), agentsMdWithLines(150));
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /WARN AGENTS\.md line count is getting large: 150 lines/.test(l)), lines.join(' | '));
    assert.ok(!lines.some((l) => /^FAIL AGENTS\.md line count/.test(l)));
  });

  test('151 lines fails the hard limit', () => {
    fs.writeFileSync(path.join(root, 'AGENTS.md'), agentsMdWithLines(151));
    const { lines, result } = collect(root);
    assert.ok(lines.some((l) => /FAIL AGENTS\.md exceeds maximum line limit: 151 lines/.test(l)), lines.join(' | '));
    assert.ok(result.errors > 0);
  });
});

describe('break: missing AGENTS.md', () => {
  let root;
  beforeEach(() => { root = baseFixture(); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('fails when AGENTS.md is absent', () => {
    fs.rmSync(path.join(root, 'AGENTS.md'));
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /^FAIL Missing root AGENTS\.md/.test(l)), lines.join(' | '));
  });

  test('reports each missing parity file individually', () => {
    fs.rmSync(path.join(root, 'CLAUDE.md'));
    fs.rmSync(path.join(root, 'GEMINI.md'));
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /FAIL CLAUDE\.md is missing/.test(l)), lines.join(' | '));
    assert.ok(lines.some((l) => /FAIL GEMINI\.md is missing/.test(l)), lines.join(' | '));
  });

  test('fails when .gitignore is absent', () => {
    fs.rmSync(path.join(root, '.gitignore'));
    const { lines } = collect(root);
    assert.ok(lines.some((l) => /FAIL Missing \.gitignore/.test(l)), lines.join(' | '));
  });
});

describe('break: harness parity drift', () => {
  let root;
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

describe('break: rules directory defects', () => {
  let root;
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

describe('break: skills front-matter defects', () => {
  let root;
  let skillFile;
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

describe('break: markdown link integrity', () => {
  let root;
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
    // Only the fragment-suffixed relative link is counted (1); the four
    // skipped targets must not inflate the total.
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

describe('break: memory.md ADR ledger', () => {
  let root;
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