import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { CliParsedOptions, CliCommand } from './cli-parse.js';
import { exportConversationToFile } from './conversation-export.js';

export interface ScriptIo {
  out?: (msg: string) => void;
  err?: (msg: string) => void;
  exit?: (code: number) => void | number;
  cwd?: string;
  spawn?: (
    file: string,
    args: string[],
    options: { cwd: string; shell: false; stdio: any }
  ) => { status: number | null; error?: Error };
}

export const SCRIPT_COMMANDS = new Set<CliCommand>([
  'guard',
  'doctor',
  'smoke',
  'pre-push',
  'completion',
  'bootstrap',
  'export'
]);

export function isScriptCommand(cmd: CliCommand): boolean {
  return SCRIPT_COMMANDS.has(cmd);
}

function resolvePackageRoot(): string {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(currentDir, '..');
}

function resolveScriptPath(
  relPath: string,
  targetDir: string,
  packageRoot: string
): string | null {
  const localCandidate = path.join(targetDir, relPath);
  if (fs.existsSync(localCandidate)) return localCandidate;
  const packageCandidate = path.join(packageRoot, relPath);
  if (fs.existsSync(packageCandidate)) return packageCandidate;
  return null;
}

function executeNodeScript(
  scriptPath: string,
  args: string[],
  cwd: string,
  io: ScriptIo
): void | number {
  const exitFn = io.exit ?? process.exit;
  if (io.spawn) {
    const res = io.spawn(process.execPath, [scriptPath, ...args], {
      cwd,
      shell: false,
      stdio: 'inherit'
    });
    return exitFn(res.status ?? 0);
  }

  const usePipe = Boolean(io.out || io.err);
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd,
    shell: false,
    stdio: usePipe ? 'pipe' : 'inherit',
    encoding: usePipe ? 'utf-8' : undefined
  });

  if (usePipe) {
    if (result.stdout && io.out) io.out(result.stdout.toString().trimEnd());
    if (result.stderr && io.err) io.err(result.stderr.toString().trimEnd());
  }
  if (result.error && io.err) {
    io.err(result.error.message);
  }
  return exitFn(result.status ?? (result.error ? 1 : 0));
}

function resolveExportTarget(targetDirOrFile: string): string {
  if (targetDirOrFile.endsWith('.md')) return targetDirOrFile;
  try {
    if (fs.existsSync(targetDirOrFile) && fs.statSync(targetDirOrFile).isDirectory()) {
      return path.join(targetDirOrFile, 'conversation-export.md');
    }
  } catch {
    // ignore
  }
  return targetDirOrFile.endsWith(path.sep)
    ? path.join(targetDirOrFile, 'conversation-export.md')
    : targetDirOrFile + '.md';
}

function handleExport(parsed: CliParsedOptions, targetDir: string, io: ScriptIo): void | number {
  const exitFn = io.exit ?? process.exit;
  const outFn = io.out ?? console.log;
  const errFn = io.err ?? console.error;
  const cwd = io.cwd ?? process.cwd();

  const transcriptPath = parsed.targetDir
    ? path.resolve(cwd, parsed.targetDir)
    : path.resolve(cwd, parsed.extraArgs?.[0] ?? '.');
  const rawOut = parsed.targetDir
    ? (parsed.extraArgs?.[0] ? path.resolve(cwd, parsed.extraArgs[0]) : cwd)
    : (parsed.extraArgs?.[1] ? path.resolve(cwd, parsed.extraArgs[1]) : cwd);
  const outTarget = resolveExportTarget(rawOut);

  try {
    const res = exportConversationToFile(transcriptPath, outTarget);
    outFn(`Exported conversation transcript to: ${res.outputPath}`);
    return exitFn(0);
  } catch (err) {
    errFn(`Export failed: ${(err as Error).message}`);
    return exitFn(1);
  }
}

export function handleScriptCommand(
  parsed: CliParsedOptions,
  io: ScriptIo
): void | number {
  const cwd = io.cwd ?? process.cwd();
  const targetDir = parsed.targetDir ? path.resolve(cwd, parsed.targetDir) : cwd;
  const pkgRoot = resolvePackageRoot();
  const errFn = io.err ?? console.error;
  const exitFn = io.exit ?? process.exit;

  switch (parsed.command) {
    case 'guard': {
      const script = resolveScriptPath('.agents/scripts/agent_guard.js', targetDir, pkgRoot);
      if (!script) { errFn('Error: agent_guard.js not found.'); return exitFn(1); }
      const args = parsed.targetDir
        ? [parsed.targetDir, ...(parsed.extraArgs ?? [])]
        : (parsed.extraArgs ?? []);
      return executeNodeScript(script, args, targetDir, io);
    }
    case 'doctor': {
      const script = resolveScriptPath('.agents/scripts/desktop_doctor.js', targetDir, pkgRoot);
      if (!script) { errFn('Error: desktop_doctor.js not found.'); return exitFn(1); }
      return executeNodeScript(script, [targetDir], targetDir, io);
    }
    case 'smoke': {
      const script = resolveScriptPath('.agents/scripts/smoke_test.js', targetDir, pkgRoot);
      if (!script) { errFn('Error: smoke_test.js not found.'); return exitFn(1); }
      return executeNodeScript(script, [targetDir], targetDir, io);
    }
    case 'pre-push': {
      const script = resolveScriptPath('scripts/pre-push.js', targetDir, pkgRoot);
      if (!script) { errFn('Error: pre-push.js not found.'); return exitFn(1); }
      return executeNodeScript(script, [targetDir], targetDir, io);
    }
    case 'completion': {
      const script = resolveScriptPath('.agents/scripts/verify_completion.js', targetDir, pkgRoot);
      if (!script) { errFn('Error: verify_completion.js not found.'); return exitFn(1); }
      return executeNodeScript(script, [targetDir], targetDir, io);
    }
    case 'bootstrap': {
      const script = resolveScriptPath('.agents/skills/lets-build/scripts/bootstrap_workspace.mjs', targetDir, pkgRoot);
      if (!script) { errFn('Error: bootstrap_workspace.mjs not found.'); return exitFn(1); }
      const args = [targetDir, ...(parsed.extraArgs ?? [])];
      return executeNodeScript(script, args, targetDir, io);
    }
    case 'export':
      return handleExport(parsed, targetDir, io);
    default:
      errFn(`Error: Unknown script command '${parsed.command}'.`);
      return exitFn(1);
  }
}

export default { isScriptCommand, handleScriptCommand };
