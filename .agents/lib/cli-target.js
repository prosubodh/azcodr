import path from 'node:path';
import readline from 'node:readline';
import fs from 'node:fs';
import process from 'node:process';
import { isProtectedTarget } from './guards.js';
export function askQuestion(query, { input = process.stdin, output = process.stdout } = {}) {
    const rl = readline.createInterface({ input, output });
    return new Promise((resolve) => {
        let resolved = false;
        rl.question(query, (answer) => {
            if (!resolved) {
                resolved = true;
                rl.close();
                resolve(answer.trim());
            }
        });
        rl.on('close', () => {
            if (!resolved) {
                resolved = true;
                resolve('');
            }
        });
    });
}
export async function promptForTargetDir(io) {
    const { stdin, stdout } = io;
    if (!stdin.isTTY)
        return '.';
    const answer = await askQuestion('? Where would you like to initialize your project? (./) ', {
        input: stdin,
        output: stdout
    });
    return answer || '.';
}
export function rejectBadTarget(resolvedTarget, templateDir) {
    if (resolvedTarget === templateDir) {
        return `Cannot scaffold into the template directory itself: ${resolvedTarget}`;
    }
    if (isProtectedTarget(resolvedTarget, { templateDir })) {
        return `Refusing to scaffold into protected directory: ${resolvedTarget}. Choose a project subdirectory instead.`;
    }
    return null;
}
export async function resolveTargetDir(targetDir, io) {
    const { cwd, templateDir } = io;
    const chosen = targetDir || (await promptForTargetDir(io));
    const resolvedTarget = path.resolve(cwd, chosen);
    const rejection = rejectBadTarget(resolvedTarget, templateDir);
    if (rejection !== null)
        return { resolvedTarget, chosen, error: rejection };
    return { resolvedTarget, chosen, error: null };
}
export function targetStatus(resolvedTarget) {
    if (!fs.existsSync(resolvedTarget))
        return { status: 'missing', count: 0 };
    if (!fs.statSync(resolvedTarget).isDirectory())
        return { status: 'not-a-directory', count: 0 };
    const count = fs.readdirSync(resolvedTarget).length;
    return { status: count === 0 ? 'empty' : 'non-empty', count };
}
export async function confirmOverwrite(targetDir, count, io) {
    const { stdin, stdout, out } = io;
    if (!stdin.isTTY)
        return { confirmed: false, aborted: false };
    const confirm = await askQuestion(`⚠️  Target directory '${targetDir}' is not empty (${count} items). Continue? (y/N) `, { input: stdin, output: stdout });
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
        out('Scaffolding aborted.');
        return { confirmed: false, aborted: true };
    }
    return { confirmed: true, aborted: false };
}
/**
 * Ensures the target may be written. Returns { force } on success or
 * { exitCode, message? } when the CLI must stop before scaffolding.
 */
export async function ensureWritableTarget(options) {
    const { chosen, resolvedTarget, force, io } = options;
    const { err } = io;
    const { status, count } = targetStatus(resolvedTarget);
    if (status === 'missing' || status === 'empty' || force)
        return { force };
    if (status === 'not-a-directory') {
        return { exitCode: 1, message: `Target '${resolvedTarget}' already exists and is not a directory.` };
    }
    const { confirmed, aborted } = await confirmOverwrite(chosen, count, io);
    if (aborted)
        return { exitCode: 0, message: null };
    if (confirmed)
        return { force: true };
    err(`Target directory '${resolvedTarget}' is not empty. Use --force to proceed.`);
    return { exitCode: 1, message: null };
}
export default {
    askQuestion,
    promptForTargetDir,
    rejectBadTarget,
    resolveTargetDir,
    targetStatus,
    confirmOverwrite,
    ensureWritableTarget
};
//# sourceMappingURL=cli-target.js.map