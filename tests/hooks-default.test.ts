/**
 * Default-off hooks regression test.
 * Hooks are disabled by default; projects opt in via harness.yaml.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const EXPECTED_HOOK_GROUPS = ['safety-guard', 'architectural-guard', 'post-tool-lint', 'stop-verifier'];

function loadHooks(fileName: string) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, '.agents', fileName), 'utf-8'));
}

describe('shipped hooks are default-off', () => {
  for (const fileName of ['hooks.json', 'hooks.json.example']) {
    test(`${fileName} disables all hooks by default`, () => {
      const hooks = loadHooks(fileName);
      for (const group of EXPECTED_HOOK_GROUPS) {
        assert.ok(hooks[group], `${fileName} must define ${group}`);
        assert.strictEqual(hooks[group].enabled, false, `${fileName}: ${group} defaults to disabled`);
      }
    });
  }

  test('every hook command that references a script resolves to a real file', () => {
    for (const fileName of ['hooks.json', 'hooks.json.example']) {
      const hooks = loadHooks(fileName);
      for (const [group, hook] of Object.entries(hooks) as [string, any][]) {
        for (const event of ['PreToolUse', 'PostToolUse', 'Stop'] as const) {
          for (const entry of hook[event] ?? []) {
            if (!entry.command) continue;
            const rel = extractScriptRelativePath(entry.command);
            if (!rel) continue;
            assert.ok(
              fs.existsSync(path.join(ROOT, rel)),
              `${fileName}: ${group} references missing script ${rel}`
            );
          }
        }
      }
    }
  });

  test('hooks.json.example mirrors the runtime hook set exactly', () => {
    const runtime = loadHooks('hooks.json');
    const example = loadHooks('hooks.json.example');
    assert.deepStrictEqual(Object.keys(example).sort(), Object.keys(runtime).sort());
    for (const group of EXPECTED_HOOK_GROUPS) {
      assert.strictEqual(example[group].enabled, runtime[group].enabled);
    }
  });
});

function extractScriptRelativePath(command: string): string | null {
  if (command.startsWith('./.agents/')) {
    return command.slice(2);
  }
  const match = command.match(/^node\s+(\.?\/?\.agents\/[^\s]+)/);
  return match?.[1] ? match[1].replace(/^\.\//, '') : null;
}