/**
 * Walk, ledger-parser, and phase-level warning/failure coverage.
 *
 * Split from tests/validate-coverage-paths.test.js.
 */
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  runValidation,
  walkMarkdown,
  parseAdrLedger
} from '../scripts/validate.js';

function collect(root) {
  const lines = [];
  const phases = [];
  const result = runValidation(root, {
    pass: (m) => lines.push(`PASS ${m}`),
    warn: (m) => lines.push(`WARN ${m}`),
    fail: (m) => lines.push(`FAIL ${m}`),
    log: (m) => lines.push(`LOG ${m}`),
    heading: (m) => phases.push(m)
  });
  return { result, lines, joined: lines.join('\n'), phases };
}

function fixture(name) {
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

describe('coverage: walkMarkdown reports unreadable directories', () => {
  let root;
  beforeEach(() => { root = fixture('walkmd'); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('invokes the failure callback for an unreadable directory', () => {
    // Feed it a path that is a FILE, not a directory: readdirSync throws ENOTDIR.
    const filePath = path.join(root, 'docs', 'rules', 'r.md');
    const failures = [];
    const found = walkMarkdown(filePath, 'rule', (m) => failures.push(m));
    assert.deepStrictEqual(found, []);
    assert.strictEqual(failures.length, 1);
    assert.match(failures[0], /Could not list rule directory/);
  });
});

describe('coverage: parseAdrLedger index-row variants', () => {
  test('ignores table rows without a leading pipe cell', () => {
    const text = ['# M', '', 'ADR-001 | title | ACCEPTED'].join('\n');
    assert.deepStrictEqual(parseAdrLedger(text).indexIds, []);
  });

  test('skips separator rows', () => {
    const text = ['# M', '', '| ID | T |', '|---|---|'].join('\n');
    assert.deepStrictEqual(parseAdrLedger(text).indexIds, []);
  });

  test('index row with no ADR cell is ignored', () => {
    const text = ['# M', '', '| ID | T |', '|---|---|', '| plain | value |'].join('\n');
    assert.deepStrictEqual(parseAdrLedger(text).indexIds, []);
  });
});

describe('coverage: phase paths for missing files and AGENTS size', () => {
  let root;
  beforeEach(() => { root = fixture('paths'); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('warns when .github/copilot-instructions.md is missing', () => {
    fs.rmSync(path.join(root, '.github', 'copilot-instructions.md'));
    const { joined } = collect(root);
    assert.match(joined, /WARN \.github\/copilot-instructions\.md is missing/);
  });

  test('warns when .github/workflows is missing', () => {
    fs.rmSync(path.join(root, '.github', 'workflows'), { recursive: true });
    const { joined } = collect(root);
    assert.match(joined, /WARN \.github\/workflows is missing/);
  });

  test('warns when AGENTS.md is between 121 and 150 lines', () => {
    fs.writeFileSync(path.join(root, 'AGENTS.md'), new Array(130).fill('l').join('\n'));
    const { joined } = collect(root);
    assert.match(joined, /WARN AGENTS\.md line count is getting large/);
  });
});

describe('coverage: phase paths for AGENTS and rule limits', () => {
  let root;
  beforeEach(() => { root = fixture('paths'); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('fails when AGENTS.md exceeds 150 lines', () => {
    fs.writeFileSync(path.join(root, 'AGENTS.md'), new Array(200).fill('l').join('\n'));
    const { joined } = collect(root);
    assert.match(joined, /FAIL AGENTS\.md exceeds maximum line limit/);
  });

  test('warns when a rule file lacks the Core Mandate line', () => {
    fs.writeFileSync(path.join(root, 'docs', 'rules', 'nomad.md'), '# Title\n');
    const { joined } = collect(root);
    assert.match(joined, /WARN Rule nomad\.md missing standardized/);
  });

  test('warns when a rule file exceeds 24KB', () => {
    fs.writeFileSync(path.join(root, 'docs', 'rules', 'big.md'), `# B\n\n${'x'.repeat(25000)}`);
    const { joined } = collect(root);
    assert.match(joined, /WARN Rule big\.md exceeds 24KB/);
  });
});

describe('coverage: phase paths for skill description gates', () => {
  let root;
  beforeEach(() => { root = fixture('paths'); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('warns when a skill description lacks the Use when prefix', () => {
    const body = '---\nname: demo\ndescription: Helps with things. Do not use in prod.\n---\n\n## Gotchas\n';
    fs.writeFileSync(path.join(root, '.agents', 'skills', 'demo', 'SKILL.md'), body);
    const { joined } = collect(root);
    assert.match(joined, /should start with imperative 'Use when/);
  });

  test('warns when a skill description lacks a negative boundary', () => {
    const body = '---\nname: demo\ndescription: Use when testing things.\n---\n\n## Gotchas\n';
    fs.writeFileSync(path.join(root, '.agents', 'skills', 'demo', 'SKILL.md'), body);
    const { joined } = collect(root);
    assert.match(joined, /should specify negative boundaries/);
  });

  test('fails when a skill name does not match its directory', () => {
    const body = '---\nname: wrong\ndescription: Use when x. Do not use y.\n---\n\n## Gotchas\n';
    fs.writeFileSync(path.join(root, '.agents', 'skills', 'demo', 'SKILL.md'), body);
    const { joined } = collect(root);
    assert.match(joined, /front matter 'name:' does not match directory name/);
  });
});

describe('coverage: phase paths for skill front-matter delimiters', () => {
  let root;
  beforeEach(() => { root = fixture('paths'); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('fails when SKILL.md has no opening front-matter delimiter', () => {
    const body = 'name: demo\ndescription: Use when x. Do not use y.\n';
    fs.writeFileSync(path.join(root, '.agents', 'skills', 'demo', 'SKILL.md'), body);
    const { joined } = collect(root);
    assert.match(joined, /missing opening front matter delimiter/);
  });

  test('fails when SKILL.md has no closing front-matter delimiter', () => {
    const body = '---\nname: demo\ndescription: Use when x. Do not use y.\n';
    fs.writeFileSync(path.join(root, '.agents', 'skills', 'demo', 'SKILL.md'), body);
    const { joined } = collect(root);
    assert.match(joined, /missing closing front matter delimiter/);
  });

  test('fails when a skill folder has no SKILL.md', () => {
    fs.rmSync(path.join(root, '.agents', 'skills', 'demo', 'SKILL.md'));
    const { joined } = collect(root);
    assert.match(joined, /missing SKILL\.md/);
  });
});

describe('coverage: phase paths for skill size and memory header', () => {
  let root;
  beforeEach(() => { root = fixture('paths'); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('warns when SKILL.md exceeds 500 lines', () => {
    const body = `---\nname: demo\ndescription: Use when x. Do not use y.\n---\n\n## Gotchas\n${'line\n'.repeat(520)}`;
    fs.writeFileSync(path.join(root, '.agents', 'skills', 'demo', 'SKILL.md'), body);
    const { joined } = collect(root);
    assert.match(joined, /exceeds 500 lines/);
  });

  test('warns when SKILL.md lacks a Gotchas section', () => {
    const body = '---\nname: demo\ndescription: Use when x. Do not use y.\n---\n\n# Demo\n';
    fs.writeFileSync(path.join(root, '.agents', 'skills', 'demo', 'SKILL.md'), body);
    const { joined } = collect(root);
    assert.match(joined, /missing mandatory 'Gotchas & What NOT to Do' section/);
  });

  test('fails when memory.md has no H1', () => {
    fs.writeFileSync(path.join(root, 'memory.md'), 'no heading\n');
    const { joined } = collect(root);
    assert.match(joined, /FAIL memory\.md missing H1 header/);
  });
});

describe('coverage: phase paths for template ADR handling', () => {
  let root;
  beforeEach(() => { root = fixture('paths'); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('warns on template-internal ADR numbering', () => {
    const mem = ['# Memory', '', '| ID | Title |', '|---|---|', '| ADR-030 | Leaked |', '', '#### ADR-030: Leaked', '', 'azcodr template'].join('\n');
    fs.writeFileSync(path.join(root, 'memory.md'), mem);
    const { joined } = collect(root);
    assert.match(joined, /may contain template-internal ADRs/);
  });

  test('fails when the glossary is blank while ADRs exist', () => {
    const mem = ['# Memory', '', '| ID | T |', '|---|---|', '| ADR-001 | One |', '', '#### ADR-001: One'].join('\n');
    fs.writeFileSync(path.join(root, 'memory.md'), mem);
    const gloss = '# UL\n\n| T | D |\n|---|---|\n| *(No domain terms defined yet)* | x | |\n';
    fs.writeFileSync(path.join(root, 'docs', 'knowledge', 'ubiquitous_language.md'), gloss);
    const { joined } = collect(root);
    assert.match(joined, /ubiquitous_language\.md has no domain terms/);
  });
});

describe('coverage: phase paths for the template waiver', () => {
  let root;
  beforeEach(() => { root = fixture('paths'); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('the template waiver passes silently when the root IS the template', () => {
    // In the template repo the waiver is intentional (glossary ships blank).
    const gloss = '# UL\n\n| T | D |\n|---|---|\n| *(No domain terms defined yet)* | x | |\n\n<!-- azcodr:glossary-waived -->';
    fs.writeFileSync(path.join(root, 'docs', 'knowledge', 'ubiquitous_language.md'), gloss);
    const mem = ['# Memory', '', '| ID | T |', '|---|---|', '| ADR-001 | One |', '', '#### ADR-001: One'].join('\n');
    fs.writeFileSync(path.join(root, 'memory.md'), mem);
    // The waiver yields a pass, so no glossary failure is raised.
    const { joined } = collect(root);
    assert.ok(!/ubiquitous_language\.md has no domain terms/.test(joined), joined);
  });

  test('fails when the ADR index lists an ADR with no entry', () => {
    const mem = ['# Memory', '', '| ID | T |', '|---|---|', '| ADR-007 | Phantom |', '', '#### ADR-001: Real'].join('\n');
    fs.writeFileSync(path.join(root, 'memory.md'), mem);
    const { joined } = collect(root);
    assert.match(joined, /ADR Master Index lists ADR-007 but no matching entry exists/);
  });
});

describe('coverage: phase paths for ADR index agreement', () => {
  let root;
  beforeEach(() => { root = fixture('paths'); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('fails when an ADR entry is absent from the index', () => {
    const mem = ['# Memory', '', '| ID | T |', '|---|---|', '| ADR-001 | Real |', '', '#### ADR-001: Real', '', '#### ADR-002: Untracked'].join('\n');
    fs.writeFileSync(path.join(root, 'memory.md'), mem);
    const { joined } = collect(root);
    assert.match(joined, /ADR-002 exists in memory\.md but is missing from the ADR Master Index/);
  });

  test('passes the ledger when index and entries agree', () => {
    const mem = ['# Memory', '', '| ID | T |', '|---|---|', '| ADR-001 | Real |', '', '#### ADR-001: Real'].join('\n');
    fs.writeFileSync(path.join(root, 'memory.md'), mem);
    const { joined } = collect(root);
    assert.match(joined, /ADR Master Index matches all 1 ADR entries/);
  });

  test('reports a clean slate when memory.md has no ADRs', () => {
    const { joined } = collect(root);
    assert.match(joined, /memory\.md is a clean slate/);
  });
});
