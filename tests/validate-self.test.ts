/**
 * The validator must pass its own governance checks.
 *
 * This is the check that would have caught stirling-engine's drift: nine
 * accepted ADRs while the Master Index still read "No decisions recorded yet",
 * reported as SUCCESS. If azcodr's own ledger rots, `npm run validate` is the
 * thing that should notice — and it runs in every scaffolded project too.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const VALIDATE_CLI = path.join(ROOT, 'scripts', 'validate-cli.js');

function runValidator(root = ROOT) {
  try {
    return {
      code: 0,
      out: execFileSync(process.execPath, [VALIDATE_CLI, root], { encoding: 'utf-8' })
    };
  } catch (err: any) {
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

  test('lint resolves through the eslint config, which must exist', () => {
    // The old form named every file explicitly; the config now owns the file
    // list, so this asserts the config exists and actually gates the tree.
    assert.match(pkg.scripts.lint, /eslint/);
    assert.ok(fs.existsSync(path.join(ROOT, 'eslint.config.js')), 'eslint.config.js is missing');
  });
});