import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const JEST_CONFIG = path.join(ROOT, 'jest.config.js');

function readJestConfig(): string {
  return fs.readFileSync(JEST_CONFIG, 'utf-8');
}

function readEslintConfig(): string {
  return fs.readFileSync(path.join(ROOT, 'eslint.config.js'), 'utf-8');
}

function collectSourceFiles(dir: string): string[] {
  const files: string[] = [];
  const stack: string[] = [dir];
  while (stack.length > 0) {
    const current = stack.pop() as string;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name.endsWith('.ts')) files.push(full);
    }
  }
  return files;
}

let patterns: string[] = [];
let thresholds: Record<string, number> = {};
let matches: string[] = [];

beforeAll(async () => {
  const config = (await import('../jest.config.js')).default;
  patterns = config.collectCoverageFrom ?? [];
  thresholds = config.coverageThreshold?.global ?? {};
  matches = config.testMatch ?? [];
});

describe('the coverage gate covers all authored source', () => {
  test('collectCoverageFrom includes every source tree', () => {
    assert.ok(patterns.includes('src/**/*.ts'));
  });

  test('no authored source file sits outside the coverage gate', () => {
    const files = collectSourceFiles(path.join(ROOT, 'src'));
    assert.ok(files.length > 0, 'expected authored TypeScript source');

    for (const full of files) {
      const relative = path.relative(ROOT, full).replace(/\\/g, '/');
      const covered = patterns.some(
        (pattern) => pattern === relative || relative.startsWith(pattern.replace(/\/\*\*.*$/, ''))
      );
      assert.ok(covered, `${relative} must be inside the coverage gate`);
    }
  });

  test('the compiled output is never instrumented directly', () => {
    // lib/ is build output; measuring it would double-count src/ and hide a
    // source file that fails to compile.
    const touchesLib = patterns.some((p) => p.includes('lib/'));
    assert.strictEqual(touchesLib, false);
  });
});

describe('coverage thresholds', () => {
  test('every metric is gated at 100', () => {
    assert.ok(thresholds, 'coverageThreshold.global must be defined');
    assert.strictEqual(thresholds.lines, 100);
    assert.strictEqual(thresholds.functions, 100);
    assert.strictEqual(thresholds.branches, 100);
    assert.strictEqual(thresholds.statements, 100);
  });

  test('the same four thresholds appear in jest.config.js', () => {
    const source = readJestConfig();
    for (const metric of ['lines', 'functions', 'branches', 'statements']) {
      assert.ok(new RegExp(`${metric}:\\s*100`).test(source), `${metric} must be gated at 100`);
    }
  });
});

describe('jest VM modules and configuration', () => {
  test('handles --experimental-vm-modules cleanly', () => {
    assert.ok(readJestConfig().includes('--experimental-vm-modules'));
  });

  test('testMatch covers the TypeScript suites', () => {
    assert.ok(matches.includes('<rootDir>/tests/**/*.test.ts'));
    assert.ok(matches.includes('<rootDir>/tests/**/*.spec.ts'));
  });
});

describe('package.json gate wiring', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));

  test('lint is a real linter over the whole tree', () => {
    assert.match(pkg.scripts.lint, /eslint/);
    assert.ok(!pkg.scripts.lint.includes('--check'));
  });

  test('validate invokes the toolkit CLI rather than a deleted script', () => {
    assert.strictEqual(pkg.scripts.validate, 'node bin/azcodr.js check');
  });

  test('the retired mutation gate is gone', () => {
    assert.strictEqual(pkg.scripts['test:mutation'], undefined);
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
    const config = readEslintConfig();
    for (const rule of ['max-lines', 'max-lines-per-function', 'complexity', 'max-params']) {
      assert.ok(
        config.includes(`'${rule}'`) || new RegExp(`^\\s*${rule}:`, 'm').test(config),
        `eslint config must enforce ${rule}`
      );
    }
  });

  test('the eslint config covers the source tree, not only compiled output', () => {
    assert.ok(readEslintConfig().includes('src/**'), 'eslint must lint authored source');
  });
});
