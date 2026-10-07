import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { main } from '../scripts/validate.js';

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

describe('main exit-code contract: health', () => {
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
});

describe('main exit-code contract: flags', () => {
  test('defaults to the --fix-tolerant argv contract', () => {
    const root = workspace();
    try {
      assert.deepStrictEqual(runMain(['--fix', root]), [0]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
