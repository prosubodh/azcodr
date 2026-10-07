/**
 * Exhaustive branch/function coverage for the validator's remaining paths.
 *
 * Several of these exercise defensive code that cannot be reached through the
 * public API on a normal filesystem -- fault-injection branches, host-specific
 * symlink handling, and parser guards. They are tested directly against the
 * exported helpers rather than through subprocess mocks, which keeps them fast
 * and deterministic.
 */
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const validator = require('../scripts/validate.js');
const {
  runValidation,
  evaluateParityTarget,
  isValidAgentsTarget,
  createLowercaseParityLink,
  createReporter,
  stripHtmlComments,
  stripFencedCode,
  walkMarkdown,
  parseAdrLedger
} = validator;

const AGENTS_FILE = '/workspace/AGENTS.md';
const AGENTS_CONTENT = '# AGENTS\nbody\n';

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

describe('coverage: evaluateParityTarget remaining verdicts', () => {
  const base = {
    label: 'CLAUDE.md',
    allowCopyFallback: true,
    agentsContent: AGENTS_CONTENT,
    agentsFile: AGENTS_FILE,
    agentsContentMissing: false,
    entries: ['AGENTS.md', 'CLAUDE.md'],
    isSymlink: false,
    linkTarget: null,
    isFile: false,
    content: ''
  };

  test('copilot file containing AGENTS.md but not a bare pointer', () => {
    const v = evaluateParityTarget({
      ...base,
      label: '.github/copilot-instructions.md',
      isFile: true,
      content: 'Follow AGENTS.md for the contract.'
    });
    assert.strictEqual(v.kind, 'pass');
  });

  test('byte-identical copy produces a warn verdict', () => {
    const v = evaluateParityTarget({ ...base, isFile: true, content: AGENTS_CONTENT });
    assert.strictEqual(v.kind, 'warn');
  });

  test('agents.md satisfied natively produces a pass verdict', () => {
    const v = evaluateParityTarget({
      ...base,
      label: 'agents.md',
      isFile: true,
      content: 'drifted content',
      entries: ['AGENTS.md']
    });
    assert.strictEqual(v.kind, 'pass');
    assert.match(v.message, /case-insensitive filesystem/);
  });

  test('an entry that is neither symlink nor file produces the fallback fail', () => {
    const v = evaluateParityTarget(base);
    assert.strictEqual(v.kind, 'fail');
    assert.match(v.message, /neither a symlink nor a regular file/);
  });
});

describe('coverage: isValidAgentsTarget absolute-path form', () => {
  test('accepts the absolute agents file path', () => {
    assert.strictEqual(isValidAgentsTarget(AGENTS_FILE, AGENTS_FILE), true);
  });

  test('rejects a different absolute path', () => {
    assert.strictEqual(isValidAgentsTarget('/workspace/OTHER.md', AGENTS_FILE), false);
  });
});

describe('coverage: createLowercaseParityLink error shapes', () => {
  const target = 'SHOULD_NOT_EXIST';

  test('reports both error codes when symlink and write fail', () => {
    const r = createLowercaseParityLink(target, {
      symlinkSync: () => { throw Object.assign(new Error('boom'), { code: 'EPERM' }); },
      writeFileSync: () => { throw Object.assign(new Error('bang'), { code: 'EROFS' }); }
    });
    assert.strictEqual(r.created, false);
    assert.match(r.reason, /EPERM/);
    assert.match(r.reason, /EROFS/);
  });

  test('falls back to messages when errors carry no code', () => {
    const r = createLowercaseParityLink(target, {
      symlinkSync: () => { throw new Error('plain symlink failure'); },
      writeFileSync: () => { throw new Error('plain write failure'); }
    });
    assert.strictEqual(r.created, false);
    assert.match(r.reason, /plain symlink failure/);
    assert.match(r.reason, /plain write failure/);
  });
});

describe('coverage: createReporter and strip helpers', () => {
  test('createReporter defaults to the console sink', () => {
    assert.doesNotThrow(() => createReporter());
  });

  test('stripHtmlComments leaves text with no comments untouched', () => {
    assert.strictEqual(stripHtmlComments('no comments here'), 'no comments here');
  });

  test('stripFencedCode leaves text with no fences untouched', () => {
    assert.strictEqual(stripFencedCode('plain\ntext'), 'plain\ntext');
  });
});

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

describe('coverage: phase-level warning and failure paths', () => {
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

  test('warns when a skill description lacks the Use when prefix', () => {
    fs.writeFileSync(
      path.join(root, '.agents', 'skills', 'demo', 'SKILL.md'),
      '---\nname: demo\ndescription: Helps with things. Do not use in prod.\n---\n\n## Gotchas\n'
    );
    const { joined } = collect(root);
    assert.match(joined, /should start with imperative 'Use when/);
  });

  test('warns when a skill description lacks a negative boundary', () => {
    fs.writeFileSync(
      path.join(root, '.agents', 'skills', 'demo', 'SKILL.md'),
      '---\nname: demo\ndescription: Use when testing things.\n---\n\n## Gotchas\n'
    );
    const { joined } = collect(root);
    assert.match(joined, /should specify negative boundaries/);
  });

  test('fails when a skill name does not match its directory', () => {
    fs.writeFileSync(
      path.join(root, '.agents', 'skills', 'demo', 'SKILL.md'),
      '---\nname: wrong\ndescription: Use when x. Do not use y.\n---\n\n## Gotchas\n'
    );
    const { joined } = collect(root);
    assert.match(joined, /front matter 'name:' does not match directory name/);
  });

  test('fails when SKILL.md has no opening front-matter delimiter', () => {
    fs.writeFileSync(
      path.join(root, '.agents', 'skills', 'demo', 'SKILL.md'),
      'name: demo\ndescription: Use when x. Do not use y.\n'
    );
    const { joined } = collect(root);
    assert.match(joined, /missing opening front matter delimiter/);
  });

  test('fails when SKILL.md has no closing front-matter delimiter', () => {
    fs.writeFileSync(
      path.join(root, '.agents', 'skills', 'demo', 'SKILL.md'),
      '---\nname: demo\ndescription: Use when x. Do not use y.\n'
    );
    const { joined } = collect(root);
    assert.match(joined, /missing closing front matter delimiter/);
  });

  test('fails when a skill folder has no SKILL.md', () => {
    fs.rmSync(path.join(root, '.agents', 'skills', 'demo', 'SKILL.md'));
    const { joined } = collect(root);
    assert.match(joined, /missing SKILL\.md/);
  });

  test('warns when SKILL.md exceeds 500 lines', () => {
    fs.writeFileSync(
      path.join(root, '.agents', 'skills', 'demo', 'SKILL.md'),
      `---\nname: demo\ndescription: Use when x. Do not use y.\n---\n\n## Gotchas\n${'line\n'.repeat(520)}`
    );
    const { joined } = collect(root);
    assert.match(joined, /exceeds 500 lines/);
  });

  test('warns when SKILL.md lacks a Gotchas section', () => {
    fs.writeFileSync(
      path.join(root, '.agents', 'skills', 'demo', 'SKILL.md'),
      '---\nname: demo\ndescription: Use when x. Do not use y.\n---\n\n# Demo\n'
    );
    const { joined } = collect(root);
    assert.match(joined, /missing mandatory 'Gotchas & What NOT to Do' section/);
  });

  test('fails when memory.md has no H1', () => {
    fs.writeFileSync(path.join(root, 'memory.md'), 'no heading\n');
    const { joined } = collect(root);
    assert.match(joined, /FAIL memory\.md missing H1 header/);
  });

  test('warns on template-internal ADR numbering', () => {
    fs.writeFileSync(
      path.join(root, 'memory.md'),
      [
        '# Memory', '',
        '| ID | Title |', '|---|---|', '| ADR-030 | Leaked |', '',
        '#### ADR-030: Leaked', '', 'azcodr template'
      ].join('\n')
    );
    const { joined } = collect(root);
    assert.match(joined, /may contain template-internal ADRs/);
  });

  test('the template waiver passes silently when the root IS the template', () => {
    // In the template repo the waiver is intentional (glossary ships blank).
    fs.writeFileSync(
      path.join(root, 'docs', 'knowledge', 'ubiquitous_language.md'),
      '# UL\n\n| T | D |\n|---|---|\n| *(No domain terms defined yet)* | x | |\n\n<!-- azcodr:glossary-waived -->'
    );
    fs.writeFileSync(
      path.join(root, 'memory.md'),
      ['# Memory', '', '| ID | T |', '|---|---|', '| ADR-001 | One |', '', '#### ADR-001: One'].join('\n')
    );
    // The waiver yields a pass, so no glossary failure is raised.
    const { joined } = collect(root);
    assert.ok(!/ubiquitous_language\.md has no domain terms/.test(joined), joined);
  });

  test('fails when the glossary is blank while ADRs exist', () => {
    fs.writeFileSync(
      path.join(root, 'memory.md'),
      ['# Memory', '', '| ID | T |', '|---|---|', '| ADR-001 | One |', '', '#### ADR-001: One'].join('\n')
    );
    fs.writeFileSync(
      path.join(root, 'docs', 'knowledge', 'ubiquitous_language.md'),
      '# UL\n\n| T | D |\n|---|---|\n| *(No domain terms defined yet)* | x | |\n'
    );
    const { joined } = collect(root);
    assert.match(joined, /ubiquitous_language\.md has no domain terms/);
  });

  test('fails when the ADR index lists an ADR with no entry', () => {
    fs.writeFileSync(
      path.join(root, 'memory.md'),
      ['# Memory', '', '| ID | T |', '|---|---|', '| ADR-007 | Phantom |', '', '#### ADR-001: Real'].join('\n')
    );
    const { joined } = collect(root);
    assert.match(joined, /ADR Master Index lists ADR-007 but no matching entry exists/);
  });

  test('fails when an ADR entry is absent from the index', () => {
    fs.writeFileSync(
      path.join(root, 'memory.md'),
      ['# Memory', '', '| ID | T |', '|---|---|', '| ADR-001 | Real |', '', '#### ADR-001: Real', '', '#### ADR-002: Untracked'].join('\n')
    );
    const { joined } = collect(root);
    assert.match(joined, /ADR-002 exists in memory\.md but is missing from the ADR Master Index/);
  });

  test('passes the ledger when index and entries agree', () => {
    fs.writeFileSync(
      path.join(root, 'memory.md'),
      ['# Memory', '', '| ID | T |', '|---|---|', '| ADR-001 | Real |', '', '#### ADR-001: Real'].join('\n')
    );
    const { joined } = collect(root);
    assert.match(joined, /ADR Master Index matches all 1 ADR entries/);
  });

  test('reports a clean slate when memory.md has no ADRs', () => {
    const { joined } = collect(root);
    assert.match(joined, /memory\.md is a clean slate/);
  });
});

describe('coverage: link checker target parsing edge cases', () => {
  let root;
  beforeEach(() => { root = fixture('links'); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  function linksVerdict(body) {
    fs.writeFileSync(path.join(root, 'LINKS.md'), body);
    return collect(root);
  }

  test('ignores a bare anchor-only link', () => {
    const { joined } = linksVerdict('[x](#some-section)\n');
    assert.ok(!/Broken markdown link/.test(joined), joined);
  });

  test('ignores a link whose path portion is empty after fragment strip', () => {
    const { joined } = linksVerdict('[x](#)\n');
    assert.ok(!/Broken markdown link/.test(joined), joined);
  });

  test('percent-encoded path that resolves is accepted', () => {
    fs.writeFileSync(path.join(root, 'file.md'), '# f\n');
    const { joined } = linksVerdict('[x](./file.md)\n');
    assert.ok(!/Broken markdown link/.test(joined), joined);
  });

  test('malformed percent-encoding is reported as broken, not crashed on', () => {
    // decodeURIComponent throws URIError on a truncated sequence; the checker
    // must fall back to the raw target rather than aborting the whole run.
    const { joined, phases } = linksVerdict('[x](./%E0%A4%A)\n');
    assert.ok(phases.length > 0, 'validation must complete all phases');
    assert.match(joined, /Broken markdown link/);
  });

  test('reports an empty inline target as a finding, not a crash', () => {
    const { joined } = linksVerdict('[x]()\n');
    assert.ok(!/Broken markdown link/.test(joined), joined);
  });

  test('counts and reports multiple broken inline links', () => {
    const { joined } = linksVerdict('[a](./X.md)\n[b](./Y.md)\n');
    assert.match(joined, /Broken markdown link: LINKS\.md -> \.\/X\.md/);
    assert.match(joined, /Broken markdown link: LINKS\.md -> \.\/Y\.md/);
  });
});

describe('coverage: workspace with no rules or skills directories', () => {
  let root;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-bare-'));
  });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('fails when docs/rules is missing', () => {
    fs.writeFileSync(path.join(root, 'AGENTS.md'), '# A\n');
    const { joined } = collect(root);
    assert.match(joined, /FAIL Missing docs\/rules directory/);
  });

  test('fails when .agents/skills is missing', () => {
    fs.mkdirSync(path.join(root, 'docs', 'rules'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs', 'rules', 'r.md'), '# R\n\n> **Core Mandate:** x\n');
    fs.writeFileSync(path.join(root, 'AGENTS.md'), '# A\n');
    const { joined } = collect(root);
    assert.match(joined, /FAIL Missing \.agents\/skills directory/);
  });

  test('fails when memory.md is missing', () => {
    fs.mkdirSync(path.join(root, 'docs', 'rules'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs', 'rules', 'r.md'), '# R\n\n> **Core Mandate:** x\n');
    fs.writeFileSync(path.join(root, 'AGENTS.md'), '# A\n');
    const { joined } = collect(root);
    assert.match(joined, /FAIL Missing memory\.md ADR ledger/);
  });
});