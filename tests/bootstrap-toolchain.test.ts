import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(
  __dirname, '..', '.agents', 'skills', 'lets-build', 'scripts', 'bootstrap_workspace.sh'
);

function findBash() {
  const candidates = [
    'C:\\Program Files\\Git\\bin\\bash.exe',
    'C:\\Program Files\\Git\\usr\\bin\\bash.exe'
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  const probe = spawnSync('bash', ['--version'], { encoding: 'utf-8' });
  return probe.status === 0 ? 'bash' : null;
}

const bash = findBash();
const skip = bash ? false : 'bash not available';
const describeSuite = skip ? describe.skip : describe;

function runBootstrap(root: string, topology = 'backend', language = 'typescript') {
  const r = spawnSync(bash!, [SCRIPT, root, topology, language], {
    encoding: 'utf-8',
    timeout: 30000
  });
  return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
}

function freshRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'azcodr-boot-tool-'));
}

function removeRoot(root: string) {
  fs.rmSync(root, { recursive: true, force: true });
}

function mustSucceed(root: string, language: string) {
  const r = runBootstrap(root, 'backend', language);
  assert.strictEqual(r.code, 0, r.out);
}

describeSuite('bootstrap toolchain: deterministic gate configs per language', () => {
  test('typescript emits an eslint config with the documented gates', () => {
    const root = freshRoot();
    try {
      mustSucceed(root, 'typescript');
      const cfg = fs.readFileSync(path.join(root, 'eslint.config.js'), 'utf-8');
      assert.match(cfg, /max-lines/);
      assert.match(cfg, /300/);
      assert.match(cfg, /complexity/);
      assert.match(cfg, /max-params/);
    } finally {
      removeRoot(root);
    }
  });

  test('python emits ruff gates with complexity and arg limits', () => {
    const root = freshRoot();
    try {
      mustSucceed(root, 'python');
      const cfg = fs.readFileSync(path.join(root, 'ruff.toml'), 'utf-8');
      assert.match(cfg, /max-complexity = 10/);
      assert.match(cfg, /max-args = 3/);
    } finally {
      removeRoot(root);
    }
  });

  test('rust emits clippy thresholds', () => {
    const root = freshRoot();
    try {
      mustSucceed(root, 'rust');
      const cfg = fs.readFileSync(path.join(root, 'clippy.toml'), 'utf-8');
      assert.match(cfg, /too-many-arguments-threshold = 3/);
      assert.match(cfg, /cognitive-complexity-threshold = 10/);
    } finally {
      removeRoot(root);
    }
  });

  test('go emits golangci funlen and gocyclo gates', () => {
    const root = freshRoot();
    try {
      mustSucceed(root, 'go');
      const cfg = fs.readFileSync(path.join(root, '.golangci.yml'), 'utf-8');
      assert.match(cfg, /funlen/);
      assert.match(cfg, /gocyclo/);
    } finally {
      removeRoot(root);
    }
  });

  test('java emits a checkstyle config with all four gates', () => {
    const root = freshRoot();
    try {
      mustSucceed(root, 'java');
      const cfg = fs.readFileSync(path.join(root, 'checkstyle.xml'), 'utf-8');
      assert.match(cfg, /FileLength/);
      assert.match(cfg, /value="300"/);
      assert.match(cfg, /ParameterNumber/);
    } finally {
      removeRoot(root);
    }
  });

  test('csharp appends the CA gates marker to .editorconfig', () => {
    const root = freshRoot();
    try {
      mustSucceed(root, 'csharp');
      const cfg = fs.readFileSync(path.join(root, '.editorconfig'), 'utf-8');
      assert.match(cfg, /azcodr fitness functions/);
      assert.match(cfg, /CA1502/);
    } finally {
      removeRoot(root);
    }
  });

  test('cpp and c emit clang-tidy function gates', () => {
    for (const language of ['cpp', 'c']) {
      const root = freshRoot();
      try {
        mustSucceed(root, language);
        const cfg = fs.readFileSync(path.join(root, '.clang-tidy'), 'utf-8');
        assert.match(cfg, /readability-function-size/);
      } finally {
        removeRoot(root);
      }
    }
  });

  test('generic emits no toolchain configs', () => {
    const root = freshRoot();
    try {
      mustSucceed(root, 'generic');
      for (const name of ['eslint.config.js', 'ruff.toml', 'clippy.toml', '.golangci.yml', 'checkstyle.xml', '.clang-tidy']) {
        assert.strictEqual(fs.existsSync(path.join(root, name)), false, `${name} must not exist for generic`);
      }
    } finally {
      removeRoot(root);
    }
  });

  test('re-runs never clobber agent-authored configs', () => {
    const root = freshRoot();
    try {
      mustSucceed(root, 'typescript');
      const target = path.join(root, 'eslint.config.js');
      fs.writeFileSync(target, '// agent-authored\n', 'utf-8');
      mustSucceed(root, 'typescript');
      assert.strictEqual(fs.readFileSync(target, 'utf-8'), '// agent-authored\n');
    } finally {
      removeRoot(root);
    }
  });

  test('node profiles rewire the starter lint placeholder to eslint', () => {
    const root = freshRoot();
    try {
      const pkg = path.join(root, 'package.json');
      fs.writeFileSync(pkg, JSON.stringify({ scripts: { lint: 'echo "No linter configured yet."' } }), 'utf-8');
      mustSucceed(root, 'typescript');
      const wired = JSON.parse(fs.readFileSync(pkg, 'utf-8'));
      assert.strictEqual(wired.scripts.lint, 'eslint .');
    } finally {
      removeRoot(root);
    }
  });

  test('agent-wired lint entries are never replaced', () => {
    const root = freshRoot();
    try {
      const pkg = path.join(root, 'package.json');
      fs.writeFileSync(pkg, JSON.stringify({ scripts: { lint: 'ruff check .' } }), 'utf-8');
      mustSucceed(root, 'typescript');
      const kept = JSON.parse(fs.readFileSync(pkg, 'utf-8'));
      assert.strictEqual(kept.scripts.lint, 'ruff check .');
    } finally {
      removeRoot(root);
    }
  });

  test('non-node profiles leave package.json alone', () => {
    const root = freshRoot();
    try {
      const r = runBootstrap(root, 'backend', 'python');
      assert.strictEqual(r.code, 0, r.out);
      assert.strictEqual(fs.existsSync(path.join(root, 'package.json')), false);
    } finally {
      removeRoot(root);
    }
  });
});
