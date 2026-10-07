/**
 * Parity-target evaluation tests.
 *
 * The symlink-detection logic is separated from its filesystem I/O so it can be
 * exercised on hosts where symlink creation is unavailable (Windows without
 * Developer Mode returns EPERM), and so the verdict is unit-testable at all.
 * Same pattern as stirling-engine's orbit_camera.hpp: pure decision logic,
 * side-effecting driver kept thin.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { evaluateParityTarget, isValidAgentsTarget, createReporter, main } = require('../scripts/validate.js');

const AGENTS_CONTENT = '# AGENTS\nbody\n';
const AGENTS_FILE = '/workspace/AGENTS.md';

function base(overrides = {}) {
  return {
    label: 'CLAUDE.md',
    allowCopyFallback: true,
    agentsContent: AGENTS_CONTENT,
    agentsFile: AGENTS_FILE,
    agentsContentMissing: false,
    entries: ['AGENTS.md', 'CLAUDE.md'],
    // Exactly one of these three describes the filesystem entry.
    isSymlink: false,
    linkTarget: null,
    isFile: false,
    content: '',
    ...overrides
  };
}

describe('evaluateParityTarget: symlink verdicts', () => {
  test('accepts a symlink pointing at AGENTS.md', () => {
    const v = evaluateParityTarget(base({ isSymlink: true, linkTarget: 'AGENTS.md' }));
    assert.strictEqual(v.kind, 'pass');
    assert.match(v.message, /valid symlink to AGENTS\.md/);
  });

  test('accepts the ./AGENTS.md spelling', () => {
    const v = evaluateParityTarget(base({ isSymlink: true, linkTarget: './AGENTS.md' }));
    assert.strictEqual(v.kind, 'pass');
  });

  test('normalizes Windows backslash targets before comparing', () => {
    const v = evaluateParityTarget(base({ isSymlink: true, linkTarget: '.\\AGENTS.md' }));
    assert.strictEqual(v.kind, 'pass', v.message);
  });

  test('accepts an absolute target equal to the agents file path', () => {
    const v = evaluateParityTarget(base({ isSymlink: true, linkTarget: '/workspace/AGENTS.md' }));
    assert.strictEqual(v.kind, 'pass', v.message);
  });

  test('rejects a symlink pointing somewhere else', () => {
    const v = evaluateParityTarget(base({ isSymlink: true, linkTarget: 'README.md' }));
    assert.strictEqual(v.kind, 'fail');
    assert.match(v.message, /points to 'README\.md' instead of 'AGENTS\.md'/);
  });

  test('accepts ../AGENTS.md only for the copilot file', () => {
    const copilot = base({
      label: '.github/copilot-instructions.md',
      isSymlink: true,
      linkTarget: '../AGENTS.md'
    });
    assert.strictEqual(evaluateParityTarget(copilot).kind, 'pass');

    const other = base({ isSymlink: true, linkTarget: '../AGENTS.md' });
    assert.strictEqual(evaluateParityTarget(other).kind, 'fail');
  });

  test('rejects a copilot symlink pointing at an unrelated file', () => {
    const v = evaluateParityTarget(base({
      label: '.github/copilot-instructions.md',
      isSymlink: true,
      linkTarget: 'other.md'
    }));
    assert.strictEqual(v.kind, 'fail');
  });
});

describe('evaluateParityTarget: text-pointer verdicts', () => {
  test('accepts a one-line text pointer', () => {
    const v = evaluateParityTarget(base({ isFile: true, content: 'AGENTS.md\n' }));
    assert.strictEqual(v.kind, 'pass');
    assert.match(v.message, /text pointer to AGENTS\.md/);
  });

  test('accepts the ./AGENTS.md pointer spelling with surrounding whitespace', () => {
    const v = evaluateParityTarget(base({ isFile: true, content: '  ./AGENTS.md  \n' }));
    assert.strictEqual(v.kind, 'pass');
  });

  test('accepts a copilot file that merely references AGENTS.md', () => {
    const v = evaluateParityTarget(base({
      label: '.github/copilot-instructions.md',
      isFile: true,
      content: 'See AGENTS.md for the full contract.\n'
    }));
    assert.strictEqual(v.kind, 'pass');
    assert.match(v.message, /references AGENTS\.md/);
  });

  test('warns on a byte-identical copy (Windows symlink fallback drift risk)', () => {
    const v = evaluateParityTarget(base({ isFile: true, content: AGENTS_CONTENT }));
    assert.strictEqual(v.kind, 'warn');
    assert.match(v.message, /byte-identical copy/);
  });

  test('does not warn on a copy when copy fallback is disallowed', () => {
    const v = evaluateParityTarget(base({
      isFile: true,
      content: AGENTS_CONTENT,
      allowCopyFallback: false
    }));
    assert.strictEqual(v.kind, 'fail');
  });

  test('does not warn on a copy when AGENTS.md content is unavailable', () => {
    const v = evaluateParityTarget(base({
      isFile: true,
      content: AGENTS_CONTENT,
      agentsContentMissing: true
    }));
    assert.strictEqual(v.kind, 'fail');
  });

  test('accepts agents.md satisfied natively by a case-insensitive filesystem', () => {
    const v = evaluateParityTarget(base({
      label: 'agents.md',
      isFile: true,
      content: 'drifted',
      entries: ['AGENTS.md']
    }));
    assert.strictEqual(v.kind, 'pass');
    assert.match(v.message, /case-insensitive filesystem/);
  });

  test('fails agents.md when neither casing is present in the directory listing', () => {
    const v = evaluateParityTarget(base({
      label: 'agents.md',
      isFile: true,
      content: 'drifted',
      entries: ['CLAUDE.md']
    }));
    assert.strictEqual(v.kind, 'fail');
  });

  test('fails an unrelated regular file', () => {
    const v = evaluateParityTarget(base({ isFile: true, content: 'random notes\n' }));
    assert.strictEqual(v.kind, 'fail');
    assert.match(v.message, /is not a symbolic link/);
  });
});

describe('evaluateParityTarget: non-file, non-symlink entry', () => {
  test('fails a directory in a parity slot', () => {
    const v = evaluateParityTarget(base());
    assert.strictEqual(v.kind, 'fail');
    assert.match(v.message, /neither a symlink nor a regular file/);
  });
});

describe('isValidAgentsTarget', () => {
  test('accepts the three accepted spellings', () => {
    assert.strictEqual(isValidAgentsTarget('AGENTS.md', AGENTS_FILE), true);
    assert.strictEqual(isValidAgentsTarget('./AGENTS.md', AGENTS_FILE), true);
    assert.strictEqual(isValidAgentsTarget(AGENTS_FILE, AGENTS_FILE), true);
  });

  test('rejects anything else', () => {
    assert.strictEqual(isValidAgentsTarget('AGENT.md', AGENTS_FILE), false);
    assert.strictEqual(isValidAgentsTarget('', AGENTS_FILE), false);
  });
});

describe('createReporter renders every severity', () => {
  function capture() {
    const lines = [];
    return { sink: { log: (m) => lines.push(m) }, lines };
  }

  test('prefixes pass, warn and fail distinctly', () => {
    const { sink, lines } = capture();
    const r = createReporter(sink);
    r.pass('ok');
    r.warn('meh');
    r.fail('bad');
    r.heading('phase');
    r.log('plain');
    assert.match(lines[0], /✅ ok/);
    assert.match(lines[1], /⚠️\s+meh/);
    assert.match(lines[2], /❌ bad/);
    assert.strictEqual(lines[3], 'phase');
    assert.strictEqual(lines[4], 'plain');
  });

  test('defaults to writing to the console', () => {
    assert.doesNotThrow(() => createReporter());
  });
});

describe('main exit-code contract', () => {
  const fs = require('node:fs');
  const os = require('node:os');
  const path = require('node:path');

  function workspace() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-main-'));
    fs.writeFileSync(path.join(root, 'AGENTS.md'), '# A\n');
    for (const n of ['CLAUDE.md', 'GEMINI.md', '.cursorrules', '.windsurfrules']) {
      fs.writeFileSync(path.join(root, n), 'AGENTS.md\n');
    }
    fs.writeFileSync(path.join(root, '.gitignore'), 'node_modules/\n');
    const rules = path.join(root, 'docs', 'rules');
    fs.mkdirSync(rules, { recursive: true });
    fs.writeFileSync(path.join(rules, 'r.md'), '# R\n\n> **Core Mandate:** x\n');
    const skill = path.join(root, '.agents', 'skills', 'demo');
    fs.mkdirSync(skill, { recursive: true });
    fs.writeFileSync(
      path.join(skill, 'SKILL.md'),
      '---\nname: demo\ndescription: Use when x. Do not use y.\n---\n\n## Gotchas\n'
    );
    fs.writeFileSync(path.join(root, 'memory.md'), '# Memory\n\nclean\n');
    return root;
  }

  function runMain(argv) {
    const seen = [];
    const originalLog = console.log;
    console.log = () => {};
    try {
      main(argv, (code) => seen.push(code));
    } finally {
      console.log = originalLog;
    }
    return seen;
  }

  test('exits 0 for a healthy workspace', () => {
    const root = workspace();
    try {
      assert.deepStrictEqual(runMain([root]), [0]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('exits 1 when the workspace is broken', () => {
    const root = workspace();
    try {
      fs.rmSync(path.join(root, '.gitignore'));
      assert.deepStrictEqual(runMain([root]), [1]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('defaults to the --fix-tolerant argv contract', () => {
    const root = workspace();
    try {
      assert.deepStrictEqual(runMain(['--fix', root]), [0]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});