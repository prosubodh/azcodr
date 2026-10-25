import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { scaffold, getTemplateDir } from './scaffold.js';
import { validate, createSilentReporter } from './validate.js';
import { handleBoundariesCommand, findSourceFiles } from './cli-boundaries.js';
import { handlePromptCommand } from './cli-prompt.js';
import { handleAddCommand } from './cli-add.js';
import { printHelp, printVersion } from './cli-help.js';
import { isScriptCommand, handleScriptCommand } from './cli-scripts.js';
import { parseArgs } from './cli-parse.js';
import { askQuestion, resolveTargetDir, ensureWritableTarget } from './cli-target.js';
function defaultStreams(io) {
    return {
        out: io.out ?? console.log,
        err: io.err ?? console.error,
        exit: io.exit ?? process.exit,
        stdin: io.stdin ?? process.stdin,
        stdout: io.stdout ?? process.stdout
    };
}
function normalizeIo(io) {
    const streams = defaultStreams(io);
    return {
        ...streams,
        cwd: io.cwd ?? process.cwd(),
        templateDir: io.templateDir ?? getTemplateDir(),
        scaffoldFn: io.scaffold ?? scaffold,
        validateFn: io.validate ?? validate,
        boundariesFn: io.boundaries ?? handleBoundariesCommand,
        promptFn: io.prompt ?? handlePromptCommand,
        addFn: io.add ?? handleAddCommand,
        scriptFn: io.script ?? handleScriptCommand
    };
}
function outBanner(fullIo) {
    fullIo.out('\n🚀 azcodr - Architecture governance toolkit\n');
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
async function handleCheckCommand(parsed, fullIo) {
    const checkDir = parsed.targetDir ? path.resolve(fullIo.cwd, parsed.targetDir) : fullIo.cwd;
    const reporter = parsed.silent ? createSilentReporter() : undefined;
    const result = await fullIo.validateFn(checkDir, reporter);
    if (result.errors !== 0)
        return fullIo.exit(1);
    const srcDir = path.join(checkDir, 'src');
    if (fs.existsSync(srcDir) && findSourceFiles(srcDir).length > 0) {
        return fullIo.boundariesFn({ ...parsed, targetDir: srcDir }, fullIo);
    }
    return fullIo.exit(0);
}
function reportDryRun(result, out) {
    for (const action of result.actions) {
        out(`  [preview] ${action}`);
    }
    out('\n🎉 Dry run completed. 0 files modified on disk.\n');
}
function reportSuccess(result, targetDir, out) {
    out('  ✅ AGENTS.md — neutral root agent contract');
    out('  ✅ memory.md — architecture decision record log');
    out('  ✅ README.md — project documentation starter');
    out('  ✅ .gitignore — version control ignore rules');
    out('  ✅ .editorconfig — editor formatting standards');
    out('  ✅ LICENSE — project license');
    if (result.gitInitialized) {
        out('  ✅ Git repository initialized');
    }
    out('\n🎉 azcodr initialized successfully!\n');
    out('Next steps:');
    let step = 1;
    if (targetDir !== '.' && targetDir !== './') {
        out(`  ${step++}. cd ${targetDir}`);
    }
    out(`  ${step++}. Open the project in your AI coding assistant`);
    out(`  ${step++}. Run /lets-build to start the requirements interview (needs drive tools, not the other way around)`);
    out(`  ${step++}. Run azcodr add <pack> to install governance capabilities as your needs evolve\n`);
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
    if (parsed.command === 'check') {
        return handleCheckCommand(parsed, fullIo);
    }
    if (parsed.command === 'boundaries') {
        return fullIo.boundariesFn(parsed, fullIo);
    }
    if (parsed.command === 'prompt') {
        return fullIo.promptFn(parsed, fullIo);
    }
    if (parsed.command === 'add') {
        return fullIo.addFn(parsed, fullIo);
    }
    if (isScriptCommand(parsed.command)) {
        return fullIo.scriptFn(parsed, fullIo);
    }
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
export { printHelp, printVersion, askQuestion };
export default {
    runCli,
    main,
    printHelp,
    printVersion,
    askQuestion
};
//# sourceMappingURL=cli.js.map