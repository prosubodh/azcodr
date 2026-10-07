const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const COVERAGE_SCRIPT = path.resolve(__dirname, '..', 'scripts', 'test_coverage.js');

describe('test_coverage.js configuration contract', () => {
  test('gates bin, lib AND the validator scripts so they cannot hide from coverage', () => {
    const source = fs.readFileSync(COVERAGE_SCRIPT, 'utf-8');
    for (const dir of ['bin', 'lib']) {
      assert.ok(
        source.includes(`--test-coverage-include=${dir}/**`),
        `expected coverage include for ${dir}/**`
      );
    }
    // Named explicitly because scripts/** would drag in the CLI entry shim,
    // which is unreachable in-process by construction.
    assert.ok(source.includes('--test-coverage-include=scripts/validate.js'));
    assert.ok(source.includes('--test-coverage-include=scripts/test_coverage.js'));
  });

test('every script with real logic is inside the coverage gate', () => {
    const scriptsDir = path.resolve(__dirname, '..', 'scripts');
    const source = fs.readFileSync(COVERAGE_SCRIPT, 'utf-8');
    const files = fs.readdirSync(scriptsDir).filter((f) => f.endsWith('.js'));
    assert.ok(files.length > 0);
    for (const f of files) {
      if (f === 'validate-cli.js') continue; // process entry, documented exception
      assert.ok(
        source.includes(`--test-coverage-include=scripts/${f}`),
        `scripts/${f} must be inside the coverage gate`
      );
    }
  });

  test('asserts an explicit threshold on branches, functions and lines', () => {
    const source = fs.readFileSync(COVERAGE_SCRIPT, 'utf-8');
    for (const metric of ['branches', 'functions', 'lines']) {
      assert.ok(
        new RegExp(`--test-coverage-${metric}=\\d+`).test(source),
        `expected a numeric ${metric} threshold`
      );
    }
    assert.ok(/--test-coverage-lines=100/.test(source), 'line coverage stays at 100%');
  });

test('the lowered branch/function thresholds are documented in-file', () => {
    // A lowered threshold is only acceptable if the reason is recorded next to
    // it. Silent numeric relaxation is how a gate quietly stops gating.
    const source = fs.readFileSync(COVERAGE_SCRIPT, 'utf-8');
    assert.ok(/host cannot produce/.test(source), 'threshold relaxation must state its cause');
    assert.ok(/validate-faults\.test\.js/.test(source), 'and point at the tests that do cover them');
  });

  test('fails closed on Node older than 22.8 (threshold flags unavailable)', () => {
    // Guard the version predicate itself: the gate must not silently pass
    // without thresholds on a runtime that cannot enforce them.
    const source = fs.readFileSync(COVERAGE_SCRIPT, 'utf-8');
    assert.ok(/major > 22 \|\| \(major === 22 && minor >= 8\)/.test(source));
    assert.ok(/requires Node >=22\.8\.0/.test(source));
  });

  test('spawns the test runner with stdio inherited so output stays visible', () => {
    const source = fs.readFileSync(COVERAGE_SCRIPT, 'utf-8');
    assert.ok(/stdio:\s*'inherit'/.test(source));
  });

  test('fails closed when the child runner is killed by a signal', () => {
  // Regression: `status ?? 0` reported SUCCESS when spawnSync returned a null
  // status because the runner was OOM-killed or timed out -- a green build
  // carrying zero coverage data.
  const source = fs.readFileSync(COVERAGE_SCRIPT, 'utf-8');
  assert.ok(/if \(result\.signal\)/.test(source), 'signal-kill must be detected');
  assert.ok(/terminated by signal/.test(source));
  assert.ok(/process\.exit\(result\.status \?\? 1\)/.test(source), 'null status must not become 0');
});

test('does not recommend npx-installing a Node binary as remediation', () => {
  // `npx --yes node@24` auto-confirms an install prompt and executes a freshly
  // downloaded binary -- the exact pattern the safety guard blocks for curl|sh.
  const source = fs.readFileSync(COVERAGE_SCRIPT, 'utf-8');
  assert.ok(!/npx\s+(--yes|-y)/.test(source), 'coverage script must not spawn npx');
});

test('coverage thresholds are enforced, not merely declared', () => {
  const source = fs.readFileSync(COVERAGE_SCRIPT, 'utf-8');
  assert.ok(/--test-coverage-branches=\d+/.test(source));
  assert.ok(/--test-coverage-functions=\d+/.test(source));
  assert.ok(/--test-coverage-lines=100/.test(source));
});
});

describe('package.json gate wiring', () => {
  const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), 'utf-8'));

  test('lint covers every source and script directory', () => {
    const lintTargets = ['bin/azcodr.js', 'lib/index.js', 'lib/scaffold.js',
      'scripts/validate.js', 'scripts/test_coverage.js'];
    for (const target of lintTargets) {
      assert.ok(pkg.scripts.lint.includes(target), `lint should cover ${target}`);
    }
  });

  test('lint covers every test file present in tests/', () => {
    const testDir = path.resolve(__dirname);
    const files = fs.readdirSync(testDir).filter((f) => f.endsWith('.test.js'));
    assert.ok(files.length > 0);
    for (const f of files) {
      assert.ok(pkg.scripts.lint.includes(f), `lint should cover tests/${f}`);
    }
  });

  test('prepublishOnly runs lint, coverage and validate', () => {
    assert.strictEqual(
      pkg.scripts.prepublishOnly,
      'npm run lint && npm run test:coverage && npm run validate'
    );
  });
});