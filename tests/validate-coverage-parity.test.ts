/**
 * Parity-target verdicts and reporter/strip unit coverage.
 *
 * Split from tests/validate-coverage-paths.test.js: pure unit describes that
 * need no filesystem fixture.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  evaluateParityTarget,
  isValidAgentsTarget,
  createLowercaseParityLink,
  createReporter,
  stripHtmlComments,
  stripFencedCode
} from '../scripts/validate.js';

const AGENTS_FILE = '/workspace/AGENTS.md';
const AGENTS_CONTENT = '# AGENTS\nbody\n';

function parityBase() {
  return {
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
}

describe('coverage: evaluateParityTarget copilot and copy verdicts', () => {
  test('copilot file containing AGENTS.md but not a bare pointer', () => {
    const v = evaluateParityTarget({
      ...parityBase(),
      label: '.github/copilot-instructions.md',
      isFile: true,
      content: 'Follow AGENTS.md for the contract.'
    });
    assert.strictEqual(v.kind, 'pass');
  });

  test('byte-identical copy produces a warn verdict', () => {
    const base = parityBase();
    const v = evaluateParityTarget({ ...base, isFile: true, content: AGENTS_CONTENT });
    assert.strictEqual(v.kind, 'warn');
  });
});

describe('coverage: evaluateParityTarget native and fallback verdicts', () => {
  test('agents.md satisfied natively produces a pass verdict', () => {
    const v = evaluateParityTarget({
      ...parityBase(),
      label: 'agents.md',
      isFile: true,
      content: 'drifted content',
      entries: ['AGENTS.md']
    });
    assert.strictEqual(v.kind, 'pass');
    assert.match(v.message, /case-insensitive filesystem/);
  });

  test('an entry that is neither symlink nor file produces the fallback fail', () => {
    const v = evaluateParityTarget(parityBase());
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
    } as any);
    assert.strictEqual(r.created, false);
    assert.match(r.reason!, /EPERM/);
    assert.match(r.reason!, /EROFS/);
  });

  test('falls back to messages when errors carry no code', () => {
    const r = createLowercaseParityLink(target, {
      symlinkSync: () => { throw new Error('plain symlink failure'); },
      writeFileSync: () => { throw new Error('plain write failure'); }
    } as any);
    assert.strictEqual(r.created, false);
    assert.match(r.reason!, /plain symlink failure/);
    assert.match(r.reason!, /plain write failure/);
  });

  test('createLowercaseParityLink defaults to node:fs implementation', () => {
    const tmp = path.join(os.tmpdir(), 'parity-default-link');
    try {
      const r = createLowercaseParityLink(tmp);
      assert.strictEqual(typeof r.created, 'boolean');
    } finally {
      if (fs.existsSync(tmp)) fs.rmSync(tmp, { force: true });
    }
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
