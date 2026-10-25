#!/usr/bin/env node

/**
 * Cross-platform PreToolUse safety & architectural enforcement hook.
 *
 * Enforces:
 *  1. Command safety (blocks destructive rm, force-push, drop db, etc.)
 *  2. Refactor-Before-Add (blocks adding lines to files over line budget)
 *  3. Test-First / RED-before-GREEN (when enabled)
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const selfDir = path.dirname(fileURLToPath(import.meta.url));

// Resolution order (first existing file wins):
//   1. AZCODR_GUARD_ENGINE override (tests, embedders).
//   2. ../lib/agent-guard.js — vendored engine shipped inside `.agents/`
//      (present in scaffolded projects; `.agents` is copied recursively).
//   3. ../../lib/agent-guard.js — azcodr repo dev layout (fallback only).
const guardCandidates = [
  process.env.AZCODR_GUARD_ENGINE,
  path.resolve(selfDir, '../lib/agent-guard.js'),
  path.resolve(selfDir, '../../lib/agent-guard.js')
].filter(Boolean);

async function getGuardModule() {
  const tried = [];
  for (const candidate of guardCandidates) {
    if (!fs.existsSync(candidate)) {
      tried.push(candidate);
      continue;
    }
    try {
      const module = await import(pathToFileURL(candidate).href);
      return {
        module,
        engineDir: path.dirname(candidate)
      };
    } catch (err) {
      tried.push(`${candidate} (unreadable: ${err.message})`);
    }
  }
  // Fail CLOSED: a guard with no engine must be loud, never a silent allow.
  // (Unparseable tool payloads still fail open inside inspectPreTool per
  // ADR-005; a missing engine is a broken install, not an ambiguous input.)
  console.error(
    '🚨 Architectural Guard misconfigured: engine module not found, refusing to fail open. Tried:\n' +
    tried.map((t) => `  - ${t}`).join('\n')
  );
  process.exit(2);
}

async function loadGuardOptions(engineDir, workspaceRoot) {
  const options = { workspaceRoot };

  // Environment overrides
  if (process.env.AZCODR_MAX_FILE_LINES) {
    const parsed = Number(process.env.AZCODR_MAX_FILE_LINES);
    if (!Number.isNaN(parsed)) options.maxFileLines = parsed;
  }
  if (process.env.AZCODR_TDD === '1' || process.env.AZCODR_TDD === 'true') {
    options.tdd = { enforceTestFirst: true };
  }
  if (process.env.AZCODR_PROTECTED_BRANCHES) {
    options.protectedBranches = process.env.AZCODR_PROTECTED_BRANCHES.split(',').map((s) => s.trim()).filter(Boolean);
  }

  // Load from harness.yaml if present
  try {
    const configModulePath = path.join(engineDir, 'harness-config.js');
    const resolveModulePath = path.join(engineDir, 'harness-resolve.js');
    if (fs.existsSync(configModulePath) && fs.existsSync(resolveModulePath)) {
      const { loadHarnessConfig } = await import(pathToFileURL(configModulePath).href);
      const { resolveChecks } = await import(pathToFileURL(resolveModulePath).href);
      const config = loadHarnessConfig(workspaceRoot);
      const checks = resolveChecks(config, config.project);

      const maxLinesCheck = checks.get('max-file-lines');
      if (maxLinesCheck?.enabled && typeof maxLinesCheck.params?.max === 'number' && options.maxFileLines === undefined) {
        options.maxFileLines = maxLinesCheck.params.max;
      }
      if (maxLinesCheck?.applies_when?.exclude && !options.excludeFilePaths) {
        options.excludeFilePaths = maxLinesCheck.applies_when.exclude;
      }

      const tddCheck = checks.get('red-before-green');
      if (tddCheck?.enabled && options.tdd === undefined) {
        options.tdd = { enforceTestFirst: true };
      }

      const protectedCheck = checks.get('protected-targets');
      if (protectedCheck?.enabled && Array.isArray(protectedCheck.params?.branches) && !options.protectedBranches) {
        options.protectedBranches = protectedCheck.params.branches;
      }
    }
  } catch {
    // Fail-open for optional project policy discovery; core safety invariants remain active.
  }

  return options;
}

async function readStdin(timeoutMs = 1500) {
  if (process.stdin.isTTY) return '';
  return new Promise((resolve) => {
    let acc = '';
    const timer = setTimeout(() => resolve(acc), timeoutMs);
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => { acc += chunk; });
    process.stdin.on('end', () => {
      clearTimeout(timer);
      resolve(acc);
    });
    process.stdin.on('error', () => {
      clearTimeout(timer);
      resolve(acc);
    });
  });
}

async function main() {
  const argvInput = process.argv.slice(2).join(' ').trim();
  const stdinInput = (await readStdin()).trim();
  const rawInput = argvInput || stdinInput;

  if (!rawInput) {
    process.exit(0);
  }

  const { module: guardModule, engineDir } = await getGuardModule();
  const options = await loadGuardOptions(engineDir, process.cwd());
  const decision = guardModule.inspectPreTool(rawInput, options);

  if (!decision.allowed) {
    console.error(`🚨 Architectural Guard: ${decision.reason}`);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(`🚨 Architectural Guard crashed: ${err?.message || err}`);
  process.exit(2);
});
