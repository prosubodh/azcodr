/**
 * Shipped shell scripts must stay executable-safe.
 *
 * Every `.sh` in `.agents/` is copied into each scaffolded project and, for the
 * two hook scripts, auto-executes with a shebang. Two failure modes proved in
 * this repository:
 *
 *   1. CRLF line endings put a `0D` before the shebang newline and before
 *      `set -euo pipefail`, so the script aborts at line 6 with
 *      "set: pipefail: invalid option name" -- every guardrail skipped.
 *      `bash -n` PARSES fine, so this is invisible to lint and to CI's own
 *      syntax check. Two shipped scripts were in exactly this state.
 *   2. A syntax error anywhere makes the script unrunnable for every consumer.
 *
 * These tests fail the build when either regresses. The CRLF check reads bytes
 * directly because Node's text APIs normalise newlines and would hide it.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const AGENTS_DIR = path.resolve(__dirname, '..', '.agents');

function shellScripts(dir = AGENTS_DIR, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) shellScripts(full, acc);
    else if (entry.name.endsWith('.sh')) acc.push(full);
  }
  return acc;
}

const scripts = shellScripts();

function findBash() {
  const candidates = [
    'C:\\Program Files\\Git\\bin\\bash.exe',
    'C:\\Program Files\\Git\\usr\\bin\\bash.exe'
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  const probe = spawnSync('bash', ['--version'], { encoding: 'utf-8' });
  return probe.status === 0 ? 'bash' : null;
}

const bash = findBash();

describe('shipped shell scripts: line endings', () => {
  test('the repository ships shell scripts to check', () => {
    assert.ok(scripts.length >= 4, `expected the shipped scripts, found ${scripts.length}`);
  });

  for (const file of scripts) {
    test(`${path.relative(AGENTS_DIR, file)} has LF line endings`, () => {
      const bytes = fs.readFileSync(file);
      const crPositions = [];
      for (let i = 0; i < bytes.length; i += 1) {
        if (bytes[i] === 13) crPositions.push(i);
      }
      assert.deepStrictEqual(
        crPositions,
        [],
        `CRLF bytes found at offsets ${crPositions.slice(0, 5).join(', ')}. ` +
        'A CRLF checkout breaks the shebang and "set -euo pipefail". ' +
        'Ensure .gitattributes has "*.sh text eol=lf" and re-normalize.'
      );
    });
  }
});

describe('shipped shell scripts: syntax', { skip: bash ? false : 'bash not available' }, () => {
  for (const file of scripts) {
    test(`${path.relative(AGENTS_DIR, file)} parses under bash -n`, () => {
      const r = spawnSync(bash, ['-n', file], { encoding: 'utf-8' });
      assert.strictEqual(r.status, 0, `syntax error in ${path.relative(AGENTS_DIR, file)}:\n${r.stderr}`);
    });
  }
});

describe('shipped shell scripts: shebangs and set flags', () => {
  for (const file of scripts) {
    test(`${path.relative(AGENTS_DIR, file)} starts with a shebang`, () => {
      const content = fs.readFileSync(file, 'utf-8');
      assert.match(content, /^#!.*\b(bash|sh)\b/, 'missing or non-shell shebang');
    });
  }

  test('both hook scripts enable strict mode early', () => {
    // Without `set -euo pipefail` a failure mid-script continues silently.
    for (const name of ['safety_guard.sh', 'verify_completion.sh']) {
      const file = path.join(AGENTS_DIR, 'scripts', name);
      const content = fs.readFileSync(file, 'utf-8');
      assert.match(content, /set -[a-z]*u[a-z]*o? pipefail|set -euo pipefail/, `${name} must set -euo pipefail`);
    }
  });

  test('.gitattributes forces LF for shell scripts', () => {
    const ga = fs.readFileSync(path.resolve(__dirname, '..', '.gitattributes'), 'utf-8');
    assert.match(ga, /\*\.sh text eol=lf/, 'missing "*.sh text eol=lf" rule');
  });
});