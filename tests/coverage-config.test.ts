import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const JEST_CONFIG = path.join(ROOT, 'jest.config.js');

function readJestConfig() {
  return fs.readFileSync(JEST_CONFIG, 'utf-8');
}

function readEslintConfig() {
  return fs.readFileSync(path.join(ROOT, 'eslint.config.js'), 'utf-8');
}

function collectScriptFiles(): string[] {
  const scriptsDir = path.join(ROOT, 'scripts');
  const files: string[] = [];
  const stack: string[] = [scriptsDir];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name.endsWith('.js')) files.push(full);
    }
  }
  return files;
}

let jestConfig: any;
beforeAll(async () => {
  const mod = await import('../jest.config.js');
  jestConfig = mod.default;
});

describe('coverage includes', () => {
  test('gates src and validator scripts in collectCoverageFrom', () => {
    assert.ok(jestConfig.collectCoverageFrom.includes('src/**/*.ts'));
    assert.ok(jestConfig.collectCoverageFrom.includes('scripts/validate.js'));
    assert.ok(jestConfig.collectCoverageFrom.includes('scripts/validate/**/*.js'));
  });

  test('every validator script with real logic is inside the coverage gate', () => {
    const files = collectScriptFiles();
    assert.ok(files.length > 0);
    for (const full of files) {
      const f = path.relative(ROOT, full).replace(/\\/g, '/');
      if (f === 'scripts/validate-cli.js') continue;
      const covered = jestConfig.collectCoverageFrom.some((pattern: string) => {
        if (pattern === f) return true;
        if (pattern === 'scripts/validate/**/*.js' && f.startsWith('scripts/validate/')) return true;
        return false;
      });
      assert.ok(covered, `${f} must be inside the coverage gate`);
    }
  });
});

describe('coverage thresholds', () => {
  test('asserts explicit Jest threshold on branches, functions and lines', () => {
    const thresholds = jestConfig.coverageThreshold?.global;
    assert.ok(thresholds, 'coverageThreshold.global must be defined');
    assert.strictEqual(thresholds.lines, 100, 'line coverage stays at 100%');
    assert.strictEqual(thresholds.functions, 97, 'functions threshold must be 97%');
    assert.strictEqual(thresholds.branches, 98, 'branches threshold must be 98%');
  });

  test('coverage thresholds are enforced in jest.config.js', () => {
    const source = readJestConfig();
    assert.ok(/lines:\s*100/.test(source));
    assert.ok(/functions:\s*97/.test(source));
    assert.ok(/branches:\s*98/.test(source));
  });
});

describe('jest VM modules and configuration', () => {
  test('handles --experimental-vm-modules cleanly', () => {
    const source = readJestConfig();
    assert.ok(source.includes('--experimental-vm-modules'));
  });

  test('testMatch covers JS, TS, and spec files in tests directory', () => {
    assert.ok(jestConfig.testMatch.includes('<rootDir>/tests/**/*.test.js'));
    assert.ok(jestConfig.testMatch.includes('<rootDir>/tests/**/*.test.ts'));
    assert.ok(jestConfig.testMatch.includes('<rootDir>/tests/**/*.spec.ts'));
  });
});

function assertRuleEnforced(config: string, rule: string) {
  assert.ok(
    config.includes(`'${rule}'`) || new RegExp(`^\\s*${rule}:`, 'm').test(config),
    `eslint config must enforce ${rule}`
  );
}

describe('package.json gate wiring', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));

  test('lint is a real linter over the whole tree, not a per-file checklist', () => {
    assert.match(pkg.scripts.lint, /eslint/);
    assert.ok(!pkg.scripts.lint.includes('--check'), 'syntax-only node --check is not a linter');
  });

  test('test and test:coverage scripts invoke Jest with experimental vm modules', () => {
    assert.strictEqual(pkg.scripts.test, 'node --experimental-vm-modules node_modules/jest/bin/jest.js');
    assert.strictEqual(
      pkg.scripts['test:coverage'],
      'node --experimental-vm-modules node_modules/jest/bin/jest.js --coverage'
    );
    assert.strictEqual(pkg.scripts['test:jest'], undefined, 'test:jest script retired');
  });

  test('the eslint config gates every source and script directory', () => {
    const config = readEslintConfig();
    for (const dir of ['bin/**', 'lib/**', 'scripts/**', 'tests/**']) {
      assert.ok(config.includes(dir), `eslint config should cover ${dir}`);
    }
  });

  test('prepublishOnly runs build, lint, coverage and validate', () => {
    assert.strictEqual(
      pkg.scripts.prepublishOnly,
      'npm run build && npm run lint && npm run test:coverage && npm run validate'
    );
  });
});

describe('eslint fitness-function wiring', () => {
  test('the eslint config enforces the documented fitness functions', () => {
    assertRuleEnforced(readEslintConfig(), 'max-lines');
    assertRuleEnforced(readEslintConfig(), 'max-lines-per-function');
    assertRuleEnforced(readEslintConfig(), 'complexity');
    assertRuleEnforced(readEslintConfig(), 'max-params');
  });
});