import assert from 'node:assert/strict';
import { parseYamlSubset, YamlSubsetError } from '../src/yaml-subset.js';

describe('YAML subset parser', () => {
  test('parses nested block mappings', () => {
    const doc = parseYamlSubset('project:\n  name: svc\n  nested:\n    deep: 1\n');
    assert.deepStrictEqual(doc, { project: { name: 'svc', nested: { deep: 1 } } });
  });

  test('parses block sequences of scalars', () => {
    const doc = parseYamlSubset('languages:\n  - typescript\n  - go\n');
    assert.deepStrictEqual(doc, { languages: ['typescript', 'go'] });
  });

  test('parses block sequences of mappings', () => {
    const doc = parseYamlSubset('checks:\n  - id: a\n    on: true\n  - id: b\n');
    assert.deepStrictEqual(doc, { checks: [{ id: 'a', on: true }, { id: 'b' }] });
  });

  test('parses inline flow sequences and mappings', () => {
    const doc = parseYamlSubset('a: [1, 2, "three"]\nb: { x: 1, y: two }\n');
    assert.deepStrictEqual(doc, { a: [1, 2, 'three'], b: { x: 1, y: 'two' } });
  });

  test('parses scalars, booleans, null and numbers', () => {
    const doc = parseYamlSubset('s: text\ni: 42\nf: 1.5\nt: true\nfa: False\nn: null\ne:\no:\n');
    assert.deepStrictEqual(doc, {
      s: 'text', i: 42, f: 1.5, t: true, fa: false, n: null, e: null, o: null
    });
  });

  test('strips comments and honours quoted strings containing colons', () => {
    const doc = parseYamlSubset('# leading\na: 1 # trailing\nb: "x: y"\nc: \'# not a comment\'\n');
    assert.deepStrictEqual(doc, { a: 1, b: 'x: y', c: '# not a comment' });
  });

  test('returns an empty document for blank or comment-only input', () => {
    assert.deepStrictEqual(parseYamlSubset(''), {});
    assert.deepStrictEqual(parseYamlSubset('\n\n# only a comment\n'), {});
  });

  test('rejects unsupported constructs loudly rather than guessing', () => {
    for (const bad of ['a: &anchor 1\n', 'a: *alias\n', 'a: !!str 1\n', 'a: |\n  block\n', 'a: >\n  folded\n']) {
      assert.throws(() => parseYamlSubset(bad), YamlSubsetError, `should reject: ${bad}`);
    }
  });

  test('rejects malformed input with the offending line number', () => {
    try {
      parseYamlSubset('a: 1\n  b: 2\n');
      assert.fail('expected a YamlSubsetError');
    } catch (err) {
      assert.ok(err instanceof YamlSubsetError);
      assert.strictEqual(err.line, 2);
      assert.match(err.message, /line 2/);
    }
  });

  test('rejects a non-object document root', () => {
    assert.throws(() => parseYamlSubset('- just\n- a list\n'), YamlSubsetError);
  });
});
