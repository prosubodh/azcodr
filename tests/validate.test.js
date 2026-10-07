const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const VALIDATE_PATH = path.resolve(__dirname, '..', 'scripts', 'validate.js');
const validateModule = require('../scripts/validate.js');

/**
 * Runs a validation phase against a synthetic workspace fixture.
 * `reporter` collects messages instead of printing them so assertions can
 * inspect the exact pass/warn/fail outcome rather than scraping stdout.
 */
function runValidation(root) {
  const lines = [];
  const reporter = {
    pass: (msg) => lines.push(`PASS ${msg}`),
    warn: (msg) => lines.push(`WARN ${msg}`),
    fail: (msg) => lines.push(`FAIL ${msg}`),
    log: () => {},
    heading: () => {}
  };
  const result = validateModule.runValidation(root, reporter);
  result.lines = lines;
  return { result, lines };
}

function createFixture(overrides = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-validate-'));
  const agentsLines = overrides.agentsLines || 40;
  const agents = overrides.agentsContent || '# Agents\n' + 'x\n'.repeat(agentsLines);
  fs.writeFileSync(path.join(root, 'AGENTS.md'), agents);
  fs.writeFileSync(path.join(root, 'CLAUDE.md'), 'AGENTS.md\n');
  fs.writeFileSync(path.join(root, 'GEMINI.md'), 'AGENTS.md\n');
  fs.writeFileSync(path.join(root, '.cursorrules'), 'AGENTS.md\n');
  fs.writeFileSync(path.join(root, '.windsurfrules'), 'AGENTS.md\n');
  fs.writeFileSync(path.join(root, '.gitignore'), 'node_modules/\n');

  const rulesDir = path.join(root, 'docs', 'rules');
  fs.mkdirSync(rulesDir, { recursive: true });
  if (overrides.rules !== false) {
    fs.writeFileSync(
      path.join(rulesDir, 'good.md'),
      '# Good Rule\n\n> **Core Mandate:** Be good.\n\n## What NOT to do\n\nNope.\n'
    );
  }

  const skillsDir = path.join(root, '.agents', 'skills');
  fs.mkdirSync(skillsDir, { recursive: true });
  if (overrides.skills !== false) {
    const skillDir = path.join(skillsDir, 'demo');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      '---\nname: demo\ndescription: "Use when testing. Do not use for production."\n---\n\n# Demo\n\n## Gotchas\n\nNone.\n'
    );
  }

  fs.writeFileSync(path.join(root, 'memory.md'), '# Memory\n\nClean slate.\n');
  if (overrides.markdown) {
    fs.writeFileSync(path.join(root, 'NOTES.md'), overrides.markdown);
  }
  return root;
}

describe('Validator: module surface', () => {
  test('exports runValidation and parseArgs without executing on require', () => {
    assert.strictEqual(typeof validateModule.runValidation, 'function');
    assert.strictEqual(typeof validateModule.parseArgs, 'function');
  });

  test('requiring the validator does not call process.exit', () => {
    assert.strictEqual(validateModule.__didAutoRun, undefined);
  });
});

describe('Validator: parseArgs', () => {
  test('returns cwd when no arguments are supplied', () => {
    assert.strictEqual(validateModule.parseArgs([]), process.cwd());
  });

  test('returns the first positional argument as the root', () => {
    assert.strictEqual(validateModule.parseArgs(['/tmp/some-root']), '/tmp/some-root');
  });

  test('ignores the --fix flag and still resolves the positional root', () => {
    assert.strictEqual(validateModule.parseArgs(['--fix', '/tmp/root']), '/tmp/root');
  });
});

describe('Validator: healthy workspace', () => {
  let root;
  beforeEach(() => { root = createFixture(); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  test('reports zero errors for a well-formed workspace', () => {
    const { result } = runValidation(root);
    assert.strictEqual(result.errors, 0, `lines: ${result.lines.join(' | ')}`);
  });

  test('records every phase heading and the rule/skill tallies', () => {
    const { result } = runValidation(root);
    assert.strictEqual(result.validatedRules, 1);
    assert.strictEqual(result.validatedSkills, 1);
    assert.strictEqual(result.totalLinks, 0);
    assert.strictEqual(result.brokenLinks.length, 0);
  });

  test('resolves relative markdown links and counts them', () => {
    const withLink = createFixture({ markdown: '# Notes\n\nSee [rule](docs/rules/good.md).\n' });
    try {
      const { result } = runValidation(withLink);
      assert.strictEqual(result.totalLinks, 1);
      assert.strictEqual(result.brokenLinks.length, 0);
    } finally {
      fs.rmSync(withLink, { recursive: true, force: true });
    }
  });
});