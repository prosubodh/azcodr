const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const COVERAGE_SCRIPT = path.resolve(__dirname, '..', 'scripts', 'test_coverage.js');

function readCoverageSource() {
  return fs.readFileSync(COVERAGE_SCRIPT, 'utf-8');
}

function readEslintConfig() {
  return fs.readFileSync(path.resolve(__dirname, '..', 'eslint.config.js'), 'utf-8');
}

function collectScriptFiles() {
  // Walks recursively: a new scripts/validate/*.js module must be gated the
  // moment it lands, or coverage silently stops covering it.
  const scriptsDir = path.resolve(__dirname, '..', 'scripts');
  const files = [];
  const stack = [scriptsDir];
  while (stack.length > 0) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name.endsWith('.js')) files.push(full);
    }
  }
  return files;
}

describe('coverage includes', () => {
  test('gates bin, lib AND the validator scripts so they cannot hide from coverage', () => {
    const source = readCoverageSource();
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
    const source = readCoverageSource();
    const root = path.resolve(__dirname, '..');
    const files = collectScriptFiles();
    assert.ok(files.length > 0);
    for (const full of files) {
      const f = path.relative(root, full).replace(/\\/g, '/');
      if (f === 'scripts/validate-cli.js') continue; // process entry, documented exception
      assert.ok(
        source.includes(`--test-coverage-include=${f}`),
        `${f} must be inside the coverage gate`
      );
    }
  });
});

describe('coverage thresholds', () => {
  test('asserts an explicit threshold on branches, functions and lines', () => {
    const source = readCoverageSource();
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
    const source = readCoverageSource();
    assert.ok(/host cannot produce/.test(source), 'threshold relaxation must state its cause');
    assert.ok(/validate-faults\.test\.js/.test(source), 'and point at the tests that do cover them');
  });

  test('coverage thresholds are enforced, not merely declared', () => {
    const source = readCoverageSource();
    assert.ok(/--test-coverage-branches=\d+/.test(source));
    assert.ok(/--test-coverage-functions=\d+/.test(source));
    assert.ok(/--test-coverage-lines=100/.test(source));
  });
});

describe('coverage fail-closed behaviors', () => {
  test('fails closed on Node older than 22.8 (threshold flags unavailable)', () => {
    // Guard the version predicate itself: the gate must not silently pass
    // without thresholds on a runtime that cannot enforce them.
    const source = readCoverageSource();
    assert.ok(/major > 22 \|\| \(major === 22 && minor >= 8\)/.test(source));
    assert.ok(/requires Node >=22\.8\.0/.test(source));
  });

  test('spawns the test runner with stdio inherited so output stays visible', () => {
    assert.ok(/stdio:\s*'inherit'/.test(readCoverageSource()));
  });

  test('fails closed when the child runner is killed by a signal', () => {
    // Regression: `status ?? 0` reported SUCCESS when spawnSync returned a null
    // status because the runner was OOM-killed or timed out -- a green build
    // carrying zero coverage data.
    const source = readCoverageSource();
    assert.ok(/if \(result\.signal\)/.test(source), 'signal-kill must be detected');
    assert.ok(/terminated by signal/.test(source));
    assert.ok(/process\.exit\(result\.status \?\? 1\)/.test(source), 'null status must not become 0');
  });

  test('does not recommend npx-installing a Node binary as remediation', () => {
    // `npx --yes node@24` auto-confirms an install prompt and executes a freshly
    // downloaded binary -- the exact pattern the safety guard blocks for curl|sh.
    assert.ok(!/npx\s+(--yes|-y)/.test(readCoverageSource()), 'coverage script must not spawn npx');
  });
});

function assertRuleEnforced(config, rule) {
  assert.ok(
    config.includes(`'${rule}'`) || new RegExp(`^\\s*${rule}:`, 'm').test(config),
    `eslint config must enforce ${rule}`
  );
}

describe('package.json gate wiring', () => {
  const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), 'utf-8'));

  test('lint is a real linter over the whole tree, not a per-file checklist', () => {
    // The old form was `node --check <explicit file list>`: syntax-only, and
    // every new file had to be registered by hand (the registration was
    // repeatedly forgotten). `eslint .` resolves coverage from the config, so
    // unregistered files are impossible by construction.
    assert.match(pkg.scripts.lint, /eslint/);
    assert.ok(!pkg.scripts.lint.includes('--check'), 'syntax-only node --check is not a linter');
  });

  test('the eslint config gates every source and script directory', () => {
    const config = readEslintConfig();
    for (const dir of ['bin/**', 'lib/**', 'scripts/**', 'tests/**']) {
      assert.ok(config.includes(dir), `eslint config should cover ${dir}`);
    }
  });

  test('prepublishOnly runs lint, coverage and validate', () => {
    assert.strictEqual(
      pkg.scripts.prepublishOnly,
      'npm run lint && npm run test:coverage && npm run validate'
    );
  });
});

describe('eslint fitness-function wiring', () => {
  test('the eslint config enforces the documented fitness functions', () => {
    // Each of these traces to docs/rules/clean_code.md section 5. A gate that
    // is documented but not configured is the exact failure this suite exists
    // to prevent (the old lint script was precisely that).
    assertRuleEnforced(readEslintConfig(), 'max-lines');
    assertRuleEnforced(readEslintConfig(), 'max-lines-per-function');
    assertRuleEnforced(readEslintConfig(), 'complexity');
    assertRuleEnforced(readEslintConfig(), 'max-params');
  });
});