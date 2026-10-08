/**
 * Argument parsing for the azcodr CLI.
 *
 * Table-driven: every boolean flag is one Map entry, so adding a flag cannot
 * raise the complexity of the parser itself.
 */
export function emptyOptions() {
    return {
        command: 'scaffold',
        targetDir: null,
        force: false,
        noGit: false,
        dryRun: false,
        silent: false
    };
}
export const CHECK_COMMANDS = new Set(['check', 'validate', 'audit']);
export const BOOLEAN_FLAGS = new Map([
    ['-f', 'force'],
    ['--force', 'force'],
    ['--no-git', 'noGit'],
    ['-d', 'dryRun'],
    ['--dry-run', 'dryRun'],
    ['-s', 'silent'],
    ['--silent', 'silent']
]);
function checkSpecialFlag(arg) {
    if (arg === '-h' || arg === '--help')
        return 'help';
    if (arg === '-v' || arg === '--version')
        return 'version';
    return null;
}
export function applyArg(state, arg) {
    const special = checkSpecialFlag(arg);
    if (special !== null)
        return { terminal: special };
    const flag = BOOLEAN_FLAGS.get(arg);
    if (flag !== undefined) {
        state[flag] = true;
        return { terminal: null };
    }
    if (arg.startsWith('-')) {
        return {
            terminal: 'unknown-flag',
            message: `Unknown argument '${arg}'. Run 'npx azcodr --help' for available options.`
        };
    }
    if (state.targetDir === null && state.command === 'scaffold' && CHECK_COMMANDS.has(arg)) {
        state.command = 'check';
        return { terminal: null };
    }
    if (!state.targetDir) {
        state.targetDir = arg;
        return { terminal: null };
    }
    return {
        terminal: 'extra-arg',
        message: `Unexpected argument '${arg}'. Run 'npx azcodr --help' for available options.`
    };
}
export function parseArgs(rawArgs) {
    const state = emptyOptions();
    for (const arg of rawArgs) {
        const outcome = applyArg(state, arg);
        if (outcome.terminal !== null) {
            return { ...state, terminal: outcome.terminal, message: outcome.message };
        }
    }
    return { ...state, terminal: null, message: undefined };
}
export default { emptyOptions, BOOLEAN_FLAGS, CHECK_COMMANDS, applyArg, parseArgs };
//# sourceMappingURL=cli-parse.js.map