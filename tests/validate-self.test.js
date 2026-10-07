/**
 * The validator must pass its own governance checks.
 *
 * This is the check that would have caught stirling-engine's drift: nine
 * accepted ADRs while the Master Index still read "No decisions recorded yet",
 * reported as SUCCESS. If azcodr's own ledger rots, `npm run validate` is the
 * thing that should notice — and it runs in every scaffolded project too.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const VALIDATE_CLI = path.join(ROOT, 'scripts', 'validate-cli.js');

function runValidator(root = ROOT) {
  try {
    return {
      code: 0,
      out: execFileSync(process.execPath, [VALIDATE_CLI, root], { encoding: 'utf-8' })
    };
  } catch (err) {
    return { code: err.status, out: `${err.stdout || ''}${err.stderr || ''}` };
  }
}

describe('Self-validation: azcodr passes its own validator', () => {
  test('exits 0 on this repository', () => {
    const { code, out } = runValidator();
    assert.strictEqual(code, 0, out);
    assert.match(out, /SUCCESS: All agentic configurations are valid and healthy/);
  });

  test('reports no warnings on this repository', () => {
    const { out } = runValidator();
    assert.match(out, /\(0 warnings\)/, out);
  });

  test('the ADR Master Index agrees with the ledger (new phase 6)', () => {
    const { out } = runValidator();
    assert.match(out, /Checking ADR Index Consistency/);
    assert.match(out, /ADR Master Index matches all \d+ ADR entries in memory\.md/);
  });

  test('the template glossary waiver is honoured, not silently absent', () => {
    const { out } = runValidator();
    assert.match(out, /ubiquitous_language\.md is intentionally blank \(template waiver\)/, out);
  });

  test('validate-cli.js is a real entry point that exits on its own', () => {
    // Proves the shim is wired, not a dead file the script merely references.
    const { code, out } = runValidator();
    assert.strictEqual(code, 0);
    assert.ok(out.includes('Validating Agentic Architecture'));
  });
});

describe('Self-validation: package scripts are runnable as declared', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));

  test('the validate script points at a file that exists', () => {
    const script = pkg.scripts.validate.split(' ').pop();
    assert.ok(fs.existsSync(path.join(ROOT, script)), `validate script target missing: ${script}`);
  });

  test('every script path referenced by lint exists', () => {
    for (const token of pkg.scripts.lint.split(' ')) {
      if (token === 'node' || token === '--check') continue;
      assert.ok(fs.existsSync(path.join(ROOT, token)), `lint target missing: ${token}`);
    }
  });
});