import fs from 'node:fs';
import path from 'node:path';
import { isProtectedTarget } from './guards.js';
import { purgeAzcodrTests } from './purge-tests.js';
import {
  TOKENS_JSON,
  MEMORY_TEMPLATE,
  ESLINT_CONFIG,
  RUFF_CONFIG,
  CLIPPY_CONFIG,
  GOLANGCI_CONFIG,
  CHECKSTYLE_CONFIG,
  CSHARP_EDITORCONFIG_SNIPPET,
  CLANG_TIDY_CONFIG,
  SMOKE_TEST_SCRIPT,
  TOPOLOGY_PATHS
} from './topology-templates.js';

export const SUPPORTED_LANGUAGES = [
  'typescript',
  'javascript',
  'deno',
  'bun',
  'python',
  'rust',
  'go',
  'java',
  'csharp',
  'cpp',
  'c',
  'generic'
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const TOPOLOGY_ALIASES: Record<string, string> = {
  emergent: 'emergent',
  custom: 'emergent',
  dynamic: 'emergent',
  extension: 'extension',
  game: 'game',
  engine: 'game',
  cli: 'cli',
  web: 'fullstack',
  saas: 'fullstack',
  fullstack: 'fullstack',
  backend: 'backend',
  frontend: 'frontend',
  'canvas-game': 'canvas-game',
  canvas: 'canvas-game',
  webgame: 'canvas-game',
  'systems-library': 'systems-library',
  embedded: 'systems-library',
  systems: 'systems-library'
};

export interface BootstrapOptions {
  topology?: string;
  language?: string;
  allowProtected?: boolean;
  dryRun?: boolean;
  resetMemory?: boolean;
  out?: (msg: string) => void;
  err?: (msg: string) => void;
}

export interface BootstrapResult {
  success: boolean;
  topology: string;
  language: string;
  actions: string[];
  error?: string;
}

function createLeaf(dir: string, actions: string[], dryRun?: boolean): void {
  actions.push(`mkdir: ${dir}`);
  if (dryRun) return;
  fs.mkdirSync(dir, { recursive: true });
  if (fs.readdirSync(dir).length === 0) {
    fs.writeFileSync(path.join(dir, '.gitkeep'), '');
  }
}

function writeUnlessExists(file: string, content: string, actions: string[], dryRun?: boolean): void {
  if (fs.existsSync(file)) return;
  actions.push(`create: ${file}`);
  if (dryRun) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf-8');
}

function emitToolchain(targetDir: string, lang: string, actions: string[], dryRun?: boolean): void {
  switch (lang) {
    case 'typescript':
    case 'javascript':
    case 'deno':
    case 'bun':
      writeUnlessExists(path.join(targetDir, 'eslint.config.js'), ESLINT_CONFIG, actions, dryRun);
      break;
    case 'python':
      writeUnlessExists(path.join(targetDir, 'ruff.toml'), RUFF_CONFIG, actions, dryRun);
      break;
    case 'rust':
      writeUnlessExists(path.join(targetDir, 'clippy.toml'), CLIPPY_CONFIG, actions, dryRun);
      break;
    case 'go':
      writeUnlessExists(path.join(targetDir, '.golangci.yml'), GOLANGCI_CONFIG, actions, dryRun);
      break;
    case 'java':
      writeUnlessExists(path.join(targetDir, 'checkstyle.xml'), CHECKSTYLE_CONFIG, actions, dryRun);
      break;
    case 'csharp': {
      const edFile = path.join(targetDir, '.editorconfig');
      if (!fs.existsSync(edFile) || !fs.readFileSync(edFile, 'utf-8').includes('azcodr fitness functions')) {
        actions.push(`append: ${edFile}`);
        if (!dryRun) {
          fs.mkdirSync(targetDir, { recursive: true });
          fs.appendFileSync(edFile, CSHARP_EDITORCONFIG_SNIPPET, 'utf-8');
        }
      }
      break;
    }
    case 'cpp':
    case 'c':
      writeUnlessExists(path.join(targetDir, '.clang-tidy'), CLANG_TIDY_CONFIG, actions, dryRun);
      break;
  }
}

function wirePackageJsonLint(targetDir: string, lang: string, dryRun?: boolean): void {
  if (!['typescript', 'javascript', 'deno', 'bun'].includes(lang)) return;
  const pkgFile = path.join(targetDir, 'package.json');
  if (!fs.existsSync(pkgFile)) return;
  try {
    const raw = fs.readFileSync(pkgFile, 'utf-8');
    if (!raw.includes('No linter configured yet')) return;
    const pkg = JSON.parse(raw);
    pkg.scripts = pkg.scripts || {};
    pkg.scripts.lint = 'eslint .';
    if (!dryRun) fs.writeFileSync(pkgFile, `${JSON.stringify(pkg, null, 2)}\n`, 'utf-8');
  } catch {
    // ignore
  }
}

function handleMemoryLedger(targetDir: string, resetMemory: boolean, outFn: (msg: string) => void): void {
  const memFile = path.join(targetDir, 'memory.md');
  if (!fs.existsSync(memFile)) return;
  const recordedAdrs = fs.readFileSync(memFile, 'utf-8')
    .split('\n')
    .filter((l) => /^####\s+ADR-[0-9]+/.test(l)).length;
  if (recordedAdrs <= 0) return;
  if (resetMemory) {
    const backup = `${memFile}.bak`;
    fs.copyFileSync(memFile, backup);
    outFn(`⚠️  AZCODR_RESET_MEMORY=1 -- RESETTING ${recordedAdrs} recorded ADR(s) in memory.md`);
    outFn(`    Backup written to ${backup}`);
    fs.writeFileSync(memFile, MEMORY_TEMPLATE);
    return;
  }
  outFn(`🧠 Preserving memory.md: ${recordedAdrs} recorded ADR(s) found.`);
  outFn('    memory.md is append-only and is never rewritten by the scaffolder.');
}

function writeProfile(targetDir: string, topo: string, lang: string, dryRun?: boolean): void {
  if (dryRun) return;
  const dir = path.join(targetDir, '.azcodr');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'workspace-profile.env'), `topology=${topo}\nlanguage=${lang}\n`, 'utf-8');
}

export function bootstrapWorkspace(
  targetDir: string,
  options: BootstrapOptions = {}
): BootstrapResult {
  const resolvedTarget = path.resolve(targetDir);
  const outFn = options.out || console.log;
  const errFn = options.err || console.error;
  const topologyInput = options.topology || 'backend';
  const languageInput = options.language || 'generic';
  const canonicalTopo = TOPOLOGY_ALIASES[topologyInput];
  const actions: string[] = [];

  if (!canonicalTopo) {
    const msg = `❌ Unknown topology: '${topologyInput}'\n\nSupported topologies:\n  emergent  extension  game|engine  canvas-game  cli  backend  web|saas|fullstack  frontend  systems-library`;
    errFn(msg);
    return { success: false, topology: topologyInput, language: languageInput, actions, error: msg };
  }

  if (!SUPPORTED_LANGUAGES.includes(languageInput as any)) {
    const msg = `❌ Unknown language profile: '${languageInput}'\n\nSupported language profiles:\n  ${SUPPORTED_LANGUAGES.join('  ')}`;
    errFn(msg);
    return { success: false, topology: topologyInput, language: languageInput, actions, error: msg };
  }

  if (isProtectedTarget(resolvedTarget) && !options.allowProtected && process.env.AZCODR_ALLOW_PROTECTED !== '1') {
    const msg = `❌ Refusing to scaffold into protected directory: ${resolvedTarget}`;
    errFn(msg);
    return { success: false, topology: topologyInput, language: languageInput, actions, error: msg };
  }

  writeProfile(resolvedTarget, topologyInput, languageInput, options.dryRun);
  purgeAzcodrTests(resolvedTarget, options.dryRun);
  handleMemoryLedger(resolvedTarget, options.resetMemory || process.env.AZCODR_RESET_MEMORY === '1', outFn);

  const paths = TOPOLOGY_PATHS[canonicalTopo] || (canonicalTopo === 'emergent' ? ['tests/unit', 'tests/integration'] : []);
  for (const rel of paths) {
    createLeaf(path.join(resolvedTarget, rel), actions, options.dryRun);
  }

  if (['fullstack', 'backend', 'frontend'].includes(canonicalTopo)) {
    writeUnlessExists(path.join(resolvedTarget, 'specs/tokens/tokens.json'), TOKENS_JSON, actions, options.dryRun);
  }

  emitToolchain(resolvedTarget, languageInput, actions, options.dryRun);
  wirePackageJsonLint(resolvedTarget, languageInput, options.dryRun);

  const smokeTestPath = path.join(resolvedTarget, 'scripts/smoke_test.mjs');
  writeUnlessExists(smokeTestPath, SMOKE_TEST_SCRIPT, actions, options.dryRun);
  if (!options.dryRun && fs.existsSync(smokeTestPath)) {
    try { fs.chmodSync(smokeTestPath, 0o755); } catch {}
  }

  outFn(`✅ Topology '${topologyInput}' scaffolded with language '${languageInput}'!`);
  outFn('');
  outFn('🛑 MANDATORY HANDOVER GATE (ADR-008):');
  outFn('   Bootstrapping is COMPLETE. Zero application domain entities have been created.');
  outFn('   DO NOT fabricate domain models, entities, or features during lets-build.');
  outFn("   Next: invoke 'product-analyst' & 'relentless-questioner' to conduct formal");
  outFn('   stakeholder domain analysis, INVEST story decomposition, and Gherkin criteria.');
  return { success: true, topology: topologyInput, language: languageInput, actions };
}

export default {
  SUPPORTED_LANGUAGES,
  TOPOLOGY_ALIASES,
  bootstrapWorkspace
};
