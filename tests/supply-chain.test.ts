/**
 * Supply-chain invariants.
 *
 * A consumer installs this package and gets code that executes on their
 * machine. The guarantee is that none of it is third-party: every external
 * package is a development-time tool that never ships. That property is worth
 * more than any dependency we could add, so it is asserted rather than
 * documented.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  bundleDependencies?: string[];
  bundledDependencies?: string[];
  files?: string[];
};

/**
 * Collects every TypeScript source file under a directory.
 */
function sourceFiles(dir: string): string[] {
  const found: string[] = [];
  const stack: string[] = [dir];
  while (stack.length > 0) {
    const current = stack.pop() as string;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) found.push(full);
    }
  }
  return found;
}

describe('every external package is a development dependency', () => {
  test('the published package declares no runtime dependencies', () => {
    assert.deepStrictEqual(
      Object.keys(pkg.dependencies ?? {}),
      [],
      'a runtime dependency would execute third-party code on install'
    );
  });

  test('no peer, optional or bundled dependencies are declared', () => {
    assert.strictEqual(pkg.peerDependencies, undefined, 'peer dependencies are runtime dependencies');
    assert.strictEqual(pkg.optionalDependencies, undefined);
    assert.strictEqual(pkg.bundleDependencies, undefined);
    assert.strictEqual(pkg.bundledDependencies, undefined);
  });

  test('every development dependency is exactly pinned', () => {
    for (const [name, version] of Object.entries(pkg.devDependencies ?? {})) {
      assert.match(
        version,
        /^\d+\.\d+\.\d+(-[\w.]+)?$/,
        `${name} must be exactly pinned so every contributor installs identical tooling`
      );
    }
  });
});

describe('shipped source imports nothing third-party', () => {
  const imports = new Set<string>();

  beforeAll(() => {
    const pattern = /(?:from|import)\s+['"]([^'"]+)['"]/g;
    for (const file of sourceFiles(path.join(ROOT, 'src'))) {
      const text = fs.readFileSync(file, 'utf-8');
      for (const match of text.matchAll(pattern)) {
        const specifier = match[1] as string;
        imports.add(specifier);
      }
    }
  });

  test('every import is a node: builtin or a relative path', () => {
    const external = [...imports].filter(
      (spec) => !spec.startsWith('node:') && !spec.startsWith('.') && !spec.startsWith('/')
    );
    assert.deepStrictEqual(
      external.filter((spec) => !spec.startsWith('@azcodr/')),
      [],
      'a non-builtin import would pull third-party code into the shipped package'
    );
  });

  test('node: builtins are used with an explicit protocol', () => {
    const bare = [...imports].filter((spec) => /^[a-z_]+$/.test(spec));
    assert.deepStrictEqual(bare, [], `bare specifiers break on some resolvers: ${bare.join(', ')}`);
  });
});

describe('the published tarball excludes installed tooling', () => {
  test('files[] never lists node_modules', () => {
    const listed = pkg.files ?? [];
    assert.ok(!listed.some((entry) => entry.includes('node_modules')));
  });

  test('every files[] entry actually exists', () => {
    for (const entry of pkg.files ?? []) {
      assert.ok(fs.existsSync(path.join(ROOT, entry)), `files[] lists a missing path: ${entry}`);
    }
  });

  test('the published tarball ships source and build output, not the toolchain config', () => {
    const listed = pkg.files ?? [];
    assert.ok(listed.includes('src'), 'JSR consumers need the TypeScript source');
    assert.ok(listed.includes('lib'), 'npm consumers need the compiled output');
    assert.ok(!listed.includes('tests'), 'test suites are not consumer-facing');
    assert.ok(!listed.includes('node_modules'));
  });
});
