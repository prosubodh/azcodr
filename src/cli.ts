import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { scaffold, getTemplateDir } from './scaffold.js';
import type { ScaffoldOptions, ScaffoldResult } from './scaffold.js';
import { validate, createSilentReporter } from './validate.js';
import { parseArgs } from './cli-parse.js';
import type { CliParsedOptions } from './cli-parse.js';
import { askQuestion, resolveTargetDir, ensureWritableTarget } from './cli-target.js';

interface PackageJsonShape {
  version: string;
}

const pkg: PackageJsonShape = JSON.parse(
  fs.readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'package.json'),
    'utf-8'
  )
);

export function printHelp(out: (msg: string) => void = console.log): void {
  out(`
azcodr v${pkg.version}
Enterprise Multi-Tenant Architecture & Agentic Engineering Starter Template

Usage:
  npx azcodr [directory] [options]
  npx azcodr check [directory] [options]

Commands:
  [directory]         Scaffold azcodr template into directory (default: current directory)
  check [directory]   Validate architecture and governance rules (alias: validate, audit)

Options:
  -d, --dry-run   Simulate scaffolding without modifying filesystem
  -s, --silent    Suppress console output messages
  -f, --force     Overwrite existing files in target directory without confirmation
  --no-git        Do not initialize a git repository
  -v, --version   Display version number
  -h, --help      Display this help message

Examples:
  npx azcodr my-project
  npx azcodr check
  npx azcodr check ./existing-repo
  npx azcodr . --dry-run
`);
}

export function printVersion(out: (msg: string) => void = console.log): void {
  out(pkg.version);
}

export interface CliIo {
  out?: (msg: string) => void;
  err?: (msg: string) => void;
  exit?: (code: number) => void | number;
  stdin?: NodeJS.ReadableStream & { isTTY?: boolean };
  stdout?: NodeJS.WritableStream;
  cwd?: string;
  templateDir?: string;
  scaffold?: (options?: ScaffoldOptions) => ScaffoldResult;
  validate?: (workspaceRoot: string, reporter?: any) => { errors: number; warnings: number } | Promise<{ errors: number; warnings: number }>;
}

export interface NormalizedCliIo {
  out: (msg: string) => void;
  err: (msg: string) => void;
  exit: (code: number) => void | number;
  stdin: NodeJS.ReadableStream & { isTTY?: boolean };
  stdout: NodeJS.WritableStream;
  cwd: string;
  templateDir: string;
  scaffoldFn: (options?: ScaffoldOptions) => ScaffoldResult;
  validateFn: (workspaceRoot: string, reporter?: any) => { errors: number; warnings: number } | Promise<{ errors: number; warnings: number }>;
}

function defaultStreams(io: CliIo) {
  return {
    out: io.out ?? console.log,
    err: io.err ?? console.error,
    exit: io.exit ?? process.exit,
    stdin: io.stdin ?? process.stdin,
    stdout: io.stdout ?? process.stdout
  };
}

function normalizeIo(io: CliIo = {}): NormalizedCliIo {
  const streams = defaultStreams(io);
  return {
    ...streams,
    cwd: io.cwd ?? process.cwd(),
    templateDir: io.templateDir ?? getTemplateDir(),
    scaffoldFn: io.scaffold ?? scaffold,
    validateFn: io.validate ?? validate
  };
}

function outBanner(fullIo: NormalizedCliIo): void {
  fullIo.out('\n🚀 azcodr - Enterprise Multi-Tenant Architecture & Agentic Engineering\n');
}

function handleTerminal(parsed: CliParsedOptions, io: NormalizedCliIo): void | number {
  const { out, err, exit } = io;
  if (parsed.terminal === 'help') {
    printHelp(out);
    return exit(0);
  }
  if (parsed.terminal === 'version') {
    printVersion(out);
    return exit(0);
  }
  err(`❌ Error: ${parsed.message}`);
  return exit(1);
}

async function handleCheckCommand(
  parsed: CliParsedOptions,
  fullIo: NormalizedCliIo
): Promise<void | number> {
  const checkDir = parsed.targetDir ? path.resolve(fullIo.cwd, parsed.targetDir) : fullIo.cwd;
  const reporter = parsed.silent ? createSilentReporter() : undefined;
  const result = await fullIo.validateFn(checkDir, reporter);
  return fullIo.exit(result.errors === 0 ? 0 : 1);
}

function reportDryRun(result: ScaffoldResult, out: (msg: string) => void): void {
  for (const action of result.actions) {
    out(`  [preview] ${action}`);
  }
  out('\n🎉 Dry run completed. 0 files modified on disk.\n');
}

function reportSuccess(result: ScaffoldResult, targetDir: string | null, out: (msg: string) => void): void {
  out('  ✅ Progressive disclosure rules copied (docs/rules/)');
  out('  ✅ Workspace knowledge hub and ADR ledger copied (docs/knowledge/, memory.md)');
  out('  ✅ Specialized agentic skills copied (.agents/skills/)');
  out('  ✅ Editor formatting standards initialized (.editorconfig)');
  out('  ✅ Agent directives and harness symlinks established (AGENTS.md, CLAUDE.md, agents.md, GEMINI.md, .cursorrules, .windsurfrules, .github/copilot-instructions.md)');
  out('  ✅ Project configuration initialized (package.json)');
  if (result.gitInitialized) {
    out('  ✅ Git repository initialized');
  }
  out('\n🎉 azcodr initialized successfully!\n');
  out('Next steps:');
  let step = 1;
  if (targetDir !== '.' && targetDir !== './') {
    out(`  ${step++}. cd ${targetDir}`);
  }
  out(`  ${step++}. Open the project in your AI coding assistant (Antigravity, Claude Code, Cursor, OpenHands)`);
  out(`  ${step++}. Run /lets-build to start the architectural interview and scaffold your application stack!\n`);
}

function runScaffold(resolvedTarget: string, parsed: CliParsedOptions, io: NormalizedCliIo): void | number {
  const { out, err, exit, templateDir, scaffoldFn } = io;
  const banner = parsed.dryRun
    ? `🔍 DRY RUN: Simulating azcodr scaffolding into: ${resolvedTarget}\n`
    : `📦 Scaffolding azcodr into: ${resolvedTarget}`;
  if (!parsed.silent) out(banner);
  try {
    const result = scaffoldFn({
      targetDir: resolvedTarget,
      force: parsed.force,
      noGit: parsed.noGit,
      templateDir,
      dryRun: parsed.dryRun,
      silent: parsed.silent
    });
    if (!parsed.silent) {
      if (parsed.dryRun) reportDryRun(result, out);
      else reportSuccess(result, parsed.targetDir, out);
    }
    return exit(0);
  } catch (error) {
    err(`\n❌ Scaffolding failed: ${(error as Error).message}\n`);
    return exit(1);
  }
}

interface ResolvePhaseResult {
  resolvedTarget?: string;
  chosen?: string;
  exitCode?: number;
}

async function resolvePhase(parsed: CliParsedOptions, fullIo: NormalizedCliIo): Promise<ResolvePhaseResult> {
  const { resolvedTarget, chosen, error } = await resolveTargetDir(parsed.targetDir, fullIo);
  if (error !== null) {
    fullIo.err(`❌ Error: ${error}`);
    return { exitCode: 1 };
  }
  return { resolvedTarget, chosen };
}

interface WritablePhaseResult {
  force?: boolean;
  exitCode?: number;
}

async function writablePhase(
  target: { chosen: string; resolvedTarget: string },
  force: boolean,
  fullIo: NormalizedCliIo
): Promise<WritablePhaseResult> {
  const writable = await ensureWritableTarget({
    chosen: target.chosen,
    resolvedTarget: target.resolvedTarget,
    force,
    io: fullIo
  });
  if (writable.exitCode === undefined) return { force: writable.force };
  if (writable.message) {
    fullIo.err(`❌ Error: ${writable.message}`);
  }
  return { exitCode: writable.exitCode };
}

export async function runCli(
  rawArgs: string[] = process.argv.slice(2),
  io: CliIo = {}
): Promise<void | number> {
  const fullIo = normalizeIo(io);
  const parsed = parseArgs(rawArgs);
  if (parsed.terminal !== null) return handleTerminal(parsed, fullIo);

  if (parsed.command === 'check') {
    return handleCheckCommand(parsed, fullIo);
  }

  if (!parsed.silent) {
    outBanner(fullIo);
  }

  const target = await resolvePhase(parsed, fullIo);
  if (target.exitCode !== undefined) return fullIo.exit(target.exitCode);

  const ready = await writablePhase(
    target as { chosen: string; resolvedTarget: string },
    parsed.force,
    fullIo
  );
  if (ready.exitCode !== undefined) return fullIo.exit(ready.exitCode);

  return runScaffold(target.resolvedTarget!, { ...parsed, force: ready.force! }, fullIo);
}

export async function main(): Promise<void> {
  try {
    await runCli(process.argv.slice(2));
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

export { askQuestion };

export default {
  runCli,
  main,
  printHelp,
  printVersion,
  askQuestion
};
