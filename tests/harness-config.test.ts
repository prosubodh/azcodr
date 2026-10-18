import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  loadHarnessConfig,
  parseHarnessConfig,
  defaultConfig,
  CORE_CHECK_IDS,
  HarnessConfigError,
  CONFIG_FILE_NAMES
} from '../src/harness-config.js';

let tmpDir: string;
beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-config-'));
});
afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeConfig(text: string): string {
  const file = path.join(tmpDir, CONFIG_FILE_NAMES[0] as string);
  fs.writeFileSync(file, text, 'utf-8');
  return file;
}

const VALID = `version: 1
project:
  languages: [typescript]
  commands:
    test: ["npm test"]
methodology: none
packs: [clean-code]
checks:
  - id: max-file-lines
    enabled: true
    params: { max: 250 }
    applies_when:
      paths: ["src/**"]
      exclude: ["**/*.d.ts"]
    severity: error
`;

describe('harness.yaml loading', () => {
  test('parses a valid document into typed config', () => {
    const cfg = parseHarnessConfig(VALID);
    assert.strictEqual(cfg.version, 1);
    assert.strictEqual(cfg.methodology, 'none');
    assert.deepStrictEqual(cfg.packs, ['clean-code']);
    assert.deepStrictEqual(cfg.project.languages, ['typescript']);
    assert.deepStrictEqual(cfg.project.commands.test, ['npm test']);
    assert.strictEqual(cfg.checks.length, 1);
    const check = cfg.checks[0];
    assert.strictEqual(check?.id, 'max-file-lines');
    assert.strictEqual(check?.params.max, 250);
    assert.deepStrictEqual(check?.applies_when.exclude, ['**/*.d.ts']);
  });

  test('returns a neutral default when no config file exists', () => {
    const cfg = loadHarnessConfig(tmpDir);
    assert.deepStrictEqual(cfg.checks, [], 'absent config must enable nothing');
    assert.strictEqual(cfg.methodology, 'none');
    assert.strictEqual(cfg.source, null);
  });

  test('discovers any of the supported config file names', () => {
    for (const name of CONFIG_FILE_NAMES) {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-cfgname-'));
      fs.writeFileSync(path.join(dir, name), 'version: 1\n', 'utf-8');
      assert.strictEqual(loadHarnessConfig(dir).source, name, `should discover ${name}`);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('reports the file and line when the document is unparseable', () => {
    const file = writeConfig('checks:\n  - id: a\n    on: true\n   oops: 1\n');
    try {
      loadHarnessConfig(tmpDir);
      assert.fail('expected a HarnessConfigError');
    } catch (err) {
      assert.ok(err instanceof HarnessConfigError);
      assert.match(err.message, new RegExp(path.basename(file)));
      assert.ok(err.line > 0);
    }
  });

  test('rejects an unsupported schema version', () => {
    assert.throws(() => parseHarnessConfig('version: 99\n'), HarnessConfigError);
  });

  test('rejects a check entry that is not an object with an id', () => {
    assert.throws(() => parseHarnessConfig('checks:\n  - "just a string"\n'), HarnessConfigError);
  });

  test('rejects an unknown severity instead of silently defaulting', () => {
    assert.throws(
      () => parseHarnessConfig('checks:\n  - id: a\n    severity: catastrophic\n'),
      HarnessConfigError
    );
  });

  test('rejects a non-array where a list is required', () => {
    assert.throws(() => parseHarnessConfig('packs: { a: b }\n'), HarnessConfigError);
  });

  test('the default config declares no checks and no packs', () => {
    const cfg = defaultConfig();
    assert.deepStrictEqual(cfg.checks, []);
    assert.deepStrictEqual(cfg.packs, []);
  });

  test('core safety checks are named and are never user-removable', () => {
    assert.ok(CORE_CHECK_IDS.includes('destructive-commands'));
    assert.ok(CORE_CHECK_IDS.includes('protected-targets'));
    assert.ok(CORE_CHECK_IDS.includes('dependency-cycles'));
  });
});
