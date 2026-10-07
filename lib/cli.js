import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { scaffold, getTemplateDir } from './scaffold.js';
import { parseArgs } from './cli-parse.js';
import { askQuestion, resolveTargetDir, ensureWritableTarget } from './cli-target.js';
const pkg = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf-8'));
export function printHelp(out = console.log) {
    out(`
azcodr v${pkg.version}
Enterprise Multi-Tenant Architecture & Agentic Engineering Starter Template

Usage:
  npx azcodr [directory] [options]

Commands:
  [directory]     Scaffold azcodr template into directory (default: current directory)

Options:
  -d, --dry-run   Simulate scaffolding without modifying filesystem
  -s, --silent    Suppress console output messages
  -f, --force     Overwrite existing files in target directory without confirmation
  --no-git        Do not initialize a git repository
  -v, --version   Display version number
  -h, --help      Display this help message

Examples:
  npx azcodr my-project
  npx azcodr . --dry-run
  npx azcodr . --force
`);
}
export function printVersion(out = console.log) {
    out(pkg.version);
}
function normalizeIo(io = {}) {
    const { out = console.log, err = console.error, exit = process.exit, stdin = process.stdin, stdout = process.stdout, cwd = process.cwd(), templateDir = getTemplateDir(), scaffold: scaffoldFn = scaffold } = io;
    return { out, err, exit, stdin, stdout, cwd, templateDir, scaffoldFn };
}
function outBanner(fullIo) {
    fullIo.out('\n🚀 azcodr - Enterprise Multi-Tenant Architecture & Agentic Engineering\n');
}
function handleTerminal(parsed, io) {
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
function reportDryRun(result, out) {
    for (const action of result.actions) {
        out(`  [preview] ${action}`);
    }
    out('\n🎉 Dry run completed. 0 files modified on disk.\n');
}
function reportSuccess(result, targetDir, out) {
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
function runScaffold(resolvedTarget, parsed, io) {
    const { out, err, exit, templateDir, scaffoldFn } = io;
    const banner = parsed.dryRun
        ? `🔍 DRY RUN: Simulating azcodr scaffolding into: ${resolvedTarget}\n`
        : `📦 Scaffolding azcodr into: ${resolvedTarget}`;
    if (!parsed.silent)
        out(banner);
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
            if (parsed.dryRun)
                reportDryRun(result, out);
            else
                reportSuccess(result, parsed.targetDir, out);
        }
        return exit(0);
    }
    catch (error) {
        err(`\n❌ Scaffolding failed: ${error.message}\n`);
        return exit(1);
    }
}
async function resolvePhase(parsed, fullIo) {
    const { resolvedTarget, chosen, error } = await resolveTargetDir(parsed.targetDir, fullIo);
    if (error !== null) {
        fullIo.err(`❌ Error: ${error}`);
        return { exitCode: 1 };
    }
    return { resolvedTarget, chosen };
}
async function writablePhase(target, force, fullIo) {
    const writable = await ensureWritableTarget({
        chosen: target.chosen,
        resolvedTarget: target.resolvedTarget,
        force,
        io: fullIo
    });
    if (writable.exitCode === undefined)
        return { force: writable.force };
    if (writable.message) {
        fullIo.err(`❌ Error: ${writable.message}`);
    }
    return { exitCode: writable.exitCode };
}
export async function runCli(rawArgs = process.argv.slice(2), io = {}) {
    const fullIo = normalizeIo(io);
    const parsed = parseArgs(rawArgs);
    if (parsed.terminal !== null)
        return handleTerminal(parsed, fullIo);
    if (!parsed.silent) {
        outBanner(fullIo);
    }
    const target = await resolvePhase(parsed, fullIo);
    if (target.exitCode !== undefined)
        return fullIo.exit(target.exitCode);
    const ready = await writablePhase(target, parsed.force, fullIo);
    if (ready.exitCode !== undefined)
        return fullIo.exit(ready.exitCode);
    return runScaffold(target.resolvedTarget, { ...parsed, force: ready.force }, fullIo);
}
export async function main() {
    try {
        await runCli(process.argv.slice(2));
    }
    catch (err) {
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
//# sourceMappingURL=cli.js.map