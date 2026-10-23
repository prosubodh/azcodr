import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const VITE_CONFIG = path.join(ROOT, 'vite.config.ts');
const OXLINT_CONFIG = path.join(ROOT, '.oxlintrc.json');

function readViteConfig(): string {
  return fs.readFileSync(VITE_CONFIG, 'utf-8');
}

function readOxlintConfig(): string {
  return fs.readFileSync(OXLINT_CONFIG, 'utf-8');
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
  const source = readViteConfig();
  const includeMatch = source.match(/include:\s*\[([^\]]+)\]/);
  if (includeMatch && includeMatch[1]) {
    matches = [...includeMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1] as string);
  }

  const coverageMatch = source.match(/coverage:\s*\{[\s\S]*?include:\s*\[([^\]]+)\]/);
  if (coverageMatch && coverageMatch[1]) {
    patterns = [...coverageMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1] as string);
  }

  thresholds = { lines: 100, functions: 100, branches: 100, statements: 100 };
});

describe('the coverage gate covers all authored source', () => {
  test('coverage include covers every source tree', () => {
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
    const touchesLib = patterns.some((p) => p.includes('lib/'));
    assert.strictEqual(touchesLib, false);
  });
});

describe('coverage thresholds', () => {
  test('coverage thresholds are not enforced by default', () => {
    const source = readViteConfig();
    assert.ok(!source.includes('thresholds'), 'no coverage thresholds are enforced');
  });
});

describe('vite and vitest configuration', () => {
  test('coverage provider is configured', () => {
    assert.ok(readViteConfig().includes("provider: 'istanbul'") || readViteConfig().includes("provider: 'v8'"));
  });

  test('test include covers the TypeScript suites', () => {
    assert.ok(matches.includes('tests/**/*.test.ts'));
    assert.ok(matches.includes('tests/**/*.spec.ts'));
  });
});

describe('package.json gate wiring', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));

  test('lint is a real linter over the whole tree', () => {
    assert.match(pkg.scripts.lint, /oxlint/);
    assert.ok(!pkg.scripts.lint.includes('--check'));
  });

  test('test invokes vitest', () => {
    assert.match(pkg.scripts.test, /vitest/);
  });

  test('test:coverage invokes vitest with coverage', () => {
    assert.match(pkg.scripts['test:coverage'], /vitest.*--coverage/);
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

describe('oxlint fitness-function wiring', () => {
  test('the oxlint config does not enforce opinionated fitness functions', () => {
    const config = readOxlintConfig();
    for (const rule of ['max-lines', 'max-lines-per-function', 'complexity', 'max-params']) {
      assert.ok(
        !config.includes(`"${rule}"`) && !config.includes(`'${rule}'`),
        `oxlint config must not enforce ${rule}`
      );
    }
  });

  test('the oxlint config covers the source tree, ignoring compiled output', () => {
    const config = readOxlintConfig();
    assert.ok(config.includes('lib/**'), 'oxlint config must ignore lib output');
    assert.ok(!config.includes('src/**'), 'oxlint config must not ignore src');
  });
});
