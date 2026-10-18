import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { isProductionFile } from '../src/agent-guard-tdd.js';
import { inspectPreTool } from '../src/agent-guard.js';
import {
  declaredLayerRules,
  loadLayerRules,
  inspectBoundariesAsync
} from '../src/boundaries.js';
import { formatBoundaryReport } from '../src/cli-boundaries.js';
import {
  parseHarnessConfig,
  loadHarnessConfig
} from '../src/harness-config.js';
import { resolveChecks, explainCheck, matchGlob } from '../src/harness-resolve.js';
import { parseYamlSubset, YamlSubsetError } from '../src/yaml-subset.js';
import { coerceScalar } from '../src/yaml-flow.js';
import { checkAdrIndexConsistency } from '../src/validator/adr.js';
import { createSilentReporter, createReporter, errorCode as ioErrorCode, walkMarkdown } from '../src/validator/io.js';
import { normalizeLinkTarget, errorCode as linkErrorCode } from '../src/validator/links.js';
import { createLowercaseParityLink, reasonFor } from '../src/validator/parity.js';
import { runValidation } from '../src/validator/run.js';
import { checkParity } from '../src/validator/root.js';

describe('Coverage & Edge Invariants Verification', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-cov-'));
  });

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  describe('agent-guard & tdd edge coverage', () => {
    test('isProductionFile respects custom nonCodeExtensions', () => {
      const rules = {
        productionPaths: ['src/**'],
        testPaths: ['tests/**'],
        nonCodeExtensions: ['.customdata', '.jpg']
      };
      assert.strictEqual(isProductionFile('src/data.customdata', rules), false);
      assert.strictEqual(isProductionFile('src/model.ts', rules), true);
      assert.strictEqual(
        isProductionFile('src/model.ts', { productionPaths: ['src/**'], testPaths: [], nonCodeExtensions: ['.customdata'] }),
        true
      );
      assert.strictEqual(
        isProductionFile('src/data.customdata', { productionPaths: ['src/**'], testPaths: [], nonCodeExtensions: ['.jpg', '.customdata'] }),
        false
      );
    });

    test('inspectPreTool handles skipFileRules and alternate envelope payload fields', () => {
      const skipRes = inspectPreTool(
        JSON.stringify({ tool_input: { filePath: 'src/main.ts', content: 'x'.repeat(400) } }),
        { skipFileRules: true }
      );
      assert.strictEqual(skipRes.allowed, true);

      const inputRes = inspectPreTool(
        JSON.stringify({ input: { filePath: 'src/model.ts', content: 'const a = 1;\n' } }),
        { maxFileLines: 50 }
      );
      assert.strictEqual(inputRes.allowed, true);

      const paramRes = inspectPreTool(
        JSON.stringify({ parameters: { filePath: 'src/model.ts', content: 'const a = 1;\n' } }),
        { maxFileLines: 50 }
      );
      assert.strictEqual(paramRes.allowed, true);
    });
  });

  describe('boundaries edge coverage', () => {
    test('declaredLayerRules returns empty on invalid directory and supports loadLayerRules', async () => {
      const invalidPath = path.join(tmpDir, 'non-existent');
      assert.deepStrictEqual(declaredLayerRules(invalidPath), []);

      const badDir = path.join(tmpDir, 'bad-boundaries');
      fs.mkdirSync(path.join(badDir, 'harness.yaml'), { recursive: true });
      assert.deepStrictEqual(declaredLayerRules(badDir), []);

      const layersDir = path.join(tmpDir, 'layers-configured');
      fs.mkdirSync(layersDir, { recursive: true });
      fs.writeFileSync(
        path.join(layersDir, 'harness.yaml'),
        'checks:\n  - id: layer-boundaries\n    layers:\n      domain: ["infra"]\n',
        'utf-8'
      );
      const configuredRules = declaredLayerRules(layersDir);
      assert.deepStrictEqual(configuredRules, [{ fromLayer: 'domain', disallowImportsFrom: ['infra'] }]);

      const rules = await loadLayerRules(tmpDir);
      assert.deepStrictEqual(rules, []);

      const report = await inspectBoundariesAsync(tmpDir);
      assert.strictEqual(report.ok, false);
      assert.strictEqual(report.moduleCount, 0);
    });

    test('formatBoundaryReport handles empty modules report', () => {
      const messages: string[] = [];
      formatBoundaryReport(
        '/workspace',
        { ok: true, moduleCount: 0, cycles: [], violations: [] },
        (msg: string) => messages.push(msg)
      );
      assert.ok(messages.some((m) => m.includes('No analysable source files')));
    });
  });

  describe('harness-config & harness-resolve edge coverage', () => {
    test('parseHarnessConfig rejects invalid methodology and check without id', () => {
      assert.throws(
        () => parseHarnessConfig('methodology: invalid-choice\n'),
        /methodology must be one of/
      );
      assert.throws(
        () => parseHarnessConfig('checks:\n  - enabled: true\n'),
        /every check entry requires a non-empty string id/
      );
      assert.throws(
        () => parseHarnessConfig('packs: [123]\n'),
        /packs\[0\] must be a string/
      );
      assert.throws(
        () => parseHarnessConfig('checks: "not-a-list"\n'),
        /checks must be a list/
      );
    });

    test('loadHarnessConfig reports error when harness.yaml is unreadable directory', () => {
      const configDir = path.join(tmpDir, 'harness.yaml');
      fs.mkdirSync(configDir);
      assert.throws(
        () => loadHarnessConfig(tmpDir),
        /cannot read harness.yaml/
      );
    });

    test('resolveChecks covers disabled check enabledFor, enabled:false, and invalid declaration recovery', () => {
      const config = parseHarnessConfig(`
version: 1
checks:
  - id: layer-boundaries
    enabled: false
  - id: max-file-lines
    severity: off
    applies_when:
      paths: ['src/**']
      exclude: ['src/vendor/**']
      languages: ['rust']
      has: ['nonexistent.txt']
      changed_only: true
`);
      const facts = { root: tmpDir, languages: [], commands: {}, changed: ['src/main.ts'] };
      const report = resolveChecks(config, facts);
      const layerCheck = report.get('layer-boundaries')!;
      assert.strictEqual(layerCheck.enabled, false);
      assert.strictEqual(layerCheck.matchedBy, 'enabled:false');

      const maxLines = report.get('max-file-lines')!;
      assert.strictEqual(maxLines.enabled, false);
      assert.strictEqual(maxLines.enabledFor('src/unchanged.ts'), false);
      assert.strictEqual(maxLines.enabledFor('src/vendor/pkg.ts'), false);

      const explanation = explainCheck(report, 'layer-boundaries');
      assert.ok(explanation.includes('check: layer-boundaries'));

      const coreReport = resolveChecks(
        parseHarnessConfig(`
version: 1
checks:
  - id: destructive-commands
    severity: off
    paths: ['src/**']
    exclude: ['test/**']
    languages: ['typescript']
`),
        { root: tmpDir, languages: ['typescript'], commands: {} }
      );
      const coreExplanation = explainCheck(coreReport, 'destructive-commands');
      assert.ok(coreExplanation.includes('note:     a core safety check cannot be disabled'));
      assert.ok(coreExplanation.includes('paths:    src/**'));
      assert.ok(coreExplanation.includes('exclude:  test/**'));
      assert.ok(coreExplanation.includes('languages: typescript'));

      const undeclared = report.get('coverage-floor')!;
      assert.strictEqual(undeclared.enabledFor('src/any.ts'), false);

      const malformedConfig = {
        ...config,
        checks: [
          {
            id: 'custom-broken',
            enabled: true,
            severity: 'error' as const,
            params: {},
            applies_when: { paths: [], exclude: [], languages: null as unknown as string[], has: [], changed_only: false },
            layers: null
          }
        ]
      };
      const malformedReport = resolveChecks(malformedConfig, facts);
      const customCheck = malformedReport.get('custom-broken')!;
      assert.strictEqual(customCheck.enabled, false);
      assert.strictEqual(customCheck.matchedBy, 'invalid');
      assert.strictEqual(explainCheck(malformedReport, 'non-existent-check'), 'non-existent-check: unknown check id.');
      assert.strictEqual(matchGlob('test.ts', 'te?t.ts'), true);
      assert.strictEqual(matchGlob('foo+bar.ts', 'foo+bar.ts'), true);

      const changedOnlyCheck = resolveChecks(
        parseHarnessConfig(`
version: 1
checks:
  - id: layer-boundaries
    changed_only: true
`),
        { root: tmpDir, languages: ['go'], commands: {}, changed: ['src/main.ts'] }
      ).get('layer-boundaries')!;
      assert.strictEqual(changedOnlyCheck.enabledFor('src/main.ts'), true);

      const langMismatchCheck = resolveChecks(
        parseHarnessConfig(`
version: 1
checks:
  - id: max-file-lines
    languages: ['rust']
`),
        { root: tmpDir, languages: ['go'], commands: {} }
      ).get('max-file-lines')!;
      assert.strictEqual(langMismatchCheck.enabled, false);
      assert.ok(langMismatchCheck.reason.includes('does not match project languages [go]'));

      const langEmptyCheck = resolveChecks(
        parseHarnessConfig(`
version: 1
checks:
  - id: max-file-lines
    languages: ['rust']
`),
        { root: tmpDir, languages: [], commands: {} }
      ).get('max-file-lines')!;
      assert.strictEqual(langEmptyCheck.enabled, false);
      assert.ok(langEmptyCheck.reason.includes('project languages [none]'));

      const langMatchCheck = resolveChecks(
        parseHarnessConfig(`
version: 1
checks:
  - id: max-file-lines
    languages: ['typescript']
`),
        { root: tmpDir, languages: ['typescript'], commands: {} }
      ).get('max-file-lines')!;
      assert.strictEqual(langMatchCheck.enabled, true);

      const undeclaredCore = resolveChecks(
        parseHarnessConfig('version: 1\nchecks: []\n'),
        { root: tmpDir, languages: [], commands: {} }
      ).get('destructive-commands')!;
      assert.strictEqual(undeclaredCore.enabledFor('any-file.ts'), true);
    });
  });

  describe('YAML parser edge coverage', () => {
    test('parses flow mappings with escaped quotes and keys', () => {
      const doc = parseYamlSubset('data: { "quoted\\"key": "val\\"with\\nquote" }\n');
      assert.deepStrictEqual(doc, { data: { 'quoted"key': 'val"with\nquote' } });

      assert.deepStrictEqual(parseYamlSubset('a: [ ]\nb: { }\n'), { a: [], b: {} });
      assert.deepStrictEqual(parseYamlSubset('root:\n  list:\n    - a\n  other: 1\n'), {
        root: { list: ['a'], other: 1 }
      });
      assert.deepStrictEqual(parseYamlSubset('list:\n  - a\nother: 1\n'), {
        list: ['a'],
        other: 1
      });
      assert.deepStrictEqual(parseYamlSubset('list:\n  -\n'), { list: [null] });
      assert.strictEqual(coerceScalar('~', 1), null);
      assert.strictEqual(coerceScalar('', 1), null);
    });

    test('parses block sequence with empty dash followed by nested value', () => {
      const doc = parseYamlSubset('items:\n  -\n    name: item1\n');
      assert.deepStrictEqual(doc, { items: [{ name: 'item1' }] });
    });

    test('throws on syntax errors in flow collections and bare mapping lines', () => {
      assert.throws(() => parseYamlSubset('a: [ "unterminated'), YamlSubsetError);
      assert.throws(() => parseYamlSubset('a: [ "one" "two" ]'), YamlSubsetError);
      assert.throws(() => parseYamlSubset('a: { x: "one" y: "two" }'), YamlSubsetError);
      assert.throws(() => parseYamlSubset('a: { key }'), YamlSubsetError);
      assert.throws(() => parseYamlSubset('a: [ unterminated'), YamlSubsetError);
      assert.throws(() => parseYamlSubset('a: { unterminated'), YamlSubsetError);
      assert.throws(() => parseYamlSubset('a: [ 1,'), YamlSubsetError);
      assert.throws(() => parseYamlSubset('a: { x: 1,'), YamlSubsetError);
      assert.throws(() => parseYamlSubset('items:\n  - 1\n  invalid: 2\n'), YamlSubsetError);
      assert.throws(() => parseYamlSubset('just_text_no_colon\n'), YamlSubsetError);
    });
  });

  describe('validator components edge coverage', () => {
    test('checkAdrIndexConsistency returns clean-slate when memory.md is missing', () => {
      const passMsgs: string[] = [];
      const failMsgs: string[] = [];
      const result = checkAdrIndexConsistency(
        tmpDir,
        (m: string) => failMsgs.push(m),
        (m: string) => passMsgs.push(m)
      );
      assert.strictEqual(result, 'clean-slate');
    });

    test('createSilentReporter invokes cleanly without error', () => {
      const silent = createSilentReporter();
      silent.pass('p');
      silent.warn('w');
      silent.fail('f');
      silent.skip?.('s');
      silent.log('l');
      silent.heading('h');
      assert.ok(true);

      const lines: string[] = [];
      const rep = createReporter({ log: (m: string) => lines.push(m) });
      rep.pass('passed');
      rep.warn('warning');
      rep.fail('failed');
      rep.skip?.('skipped');
      rep.log('logged');
      rep.heading('heading');
      assert.strictEqual(lines.length, 6);
    });

    test('normalizeLinkTarget handles angled links, protocols, and mailto', () => {
      const angled = normalizeLinkTarget('<./relative.md>');
      assert.strictEqual(angled?.target, './relative.md');

      assert.strictEqual(normalizeLinkTarget(''), null);
      assert.strictEqual(normalizeLinkTarget('https://example.com'), null);
      assert.strictEqual(normalizeLinkTarget('mailto:user@test.com'), null);
      assert.strictEqual(normalizeLinkTarget('//cdn.example.com/file'), null);
      assert.strictEqual(normalizeLinkTarget('#section-only'), null);
    });

    test('runValidation validates workspace with reference links and html anchors', () => {
      const mdFile = path.join(tmpDir, 'test.md');
      fs.writeFileSync(
        mdFile,
        '# Doc\n[ref]: ./target.md\n<a href="./other.md">Link</a>\n',
        'utf-8'
      );
      fs.writeFileSync(path.join(tmpDir, 'target.md'), '# Target\n', 'utf-8');
      fs.writeFileSync(path.join(tmpDir, 'other.md'), '# Other\n', 'utf-8');

      const passMsgs: string[] = [];
      const failMsgs: string[] = [];
      const reporter = {
        pass: (m: string) => passMsgs.push(m),
        fail: (m: string) => failMsgs.push(m),
        warn: () => {},
        skip: () => {},
        log: () => {},
        heading: () => {}
      };
      runValidation(tmpDir, reporter);
      assert.strictEqual(failMsgs.length, 0);
      assert.ok(passMsgs.some((m) => m.includes('2 internal links')));
    });

    test('checkParity reports failure when target is missing', () => {
      const failMsgs: string[] = [];
      const ctx = {
        workspaceRoot: tmpDir,
        agentsFile: path.join(tmpDir, 'AGENTS.md'),
        agentsContent: '',
        pass: () => {},
        warn: () => {},
        fail: (m: string) => failMsgs.push(m),
        skip: () => {},
        log: () => {},
        heading: () => {},
        linkCount: 0,
        broken: [],
        visitedRealPaths: new Set<string>()
      };
      checkParity(path.join(tmpDir, 'missing-file.md'), 'missing-file.md', ctx);
      assert.ok(failMsgs.some((m) => m.includes('missing-file.md is missing')));
    });

    test('createLowercaseParityLink handles uncreatable target directory failure', () => {
      const invalidPath = path.join(tmpDir, 'non_existent_subdir', 'deep', 'agents.md');
      const result = createLowercaseParityLink(invalidPath);
      assert.strictEqual(result.created, false);
      assert.ok((result.reason ?? '').length > 0);
    });

    test('error code helpers handle Error instances without code and strings', () => {
      assert.strictEqual(ioErrorCode(new Error('plain')), 'plain');
      assert.strictEqual(ioErrorCode('raw-str'), 'raw-str');
      assert.strictEqual(linkErrorCode(new Error('plain')), 'plain');
      assert.strictEqual(linkErrorCode('raw-str'), 'raw-str');
      assert.strictEqual(reasonFor(new Error('plain')), 'plain');
      assert.strictEqual(reasonFor('raw-str'), 'raw-str');
    });

    test('walkMarkdown handles unreadable directory without fail callback', () => {
      const missingDir = path.join(tmpDir, 'does-not-exist');
      assert.deepStrictEqual(walkMarkdown(missingDir, 'rules'), []);
    });
  });
});
