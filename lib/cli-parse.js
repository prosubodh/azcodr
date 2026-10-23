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
        packName: null,
        extraArgs: [],
        prune: false,
        force: false,
        noGit: false,
        dryRun: false,
        silent: false
    };
}
export const CHECK_COMMANDS = new Set(['check', 'validate', 'audit']);
export const BOUNDARY_COMMANDS = new Set(['boundaries', 'boundary', 'cycles']);
export const PROMPT_COMMANDS = new Set(['prompt', 'ledger']);
export const ADD_COMMANDS = new Set(['add']);
export const GUARD_COMMANDS = new Set(['guard', 'agent-guard', 'safety-guard']);
export const DOCTOR_COMMANDS = new Set(['doctor', 'desktop-doctor']);
export const SMOKE_COMMANDS = new Set(['smoke', 'smoke-test']);
export const PRE_PUSH_COMMANDS = new Set(['pre-push', 'hook']);
export const COMPLETION_COMMANDS = new Set(['verify-completion', 'completion', 'stop-guard']);
export const BOOTSTRAP_COMMANDS = new Set(['bootstrap', 'lets-build']);
export const EXPORT_COMMANDS = new Set(['export', 'export-memory']);
export const BOOLEAN_FLAGS = new Map([
    ['-f', 'force'],
    ['--force', 'force'],
    ['--no-git', 'noGit'],
    ['-d', 'dryRun'],
    ['--dry-run', 'dryRun'],
    ['-s', 'silent'],
    ['--silent', 'silent'],
    ['--prune', 'prune']
]);
function checkSpecialFlag(arg) {
    if (arg === '-h' || arg === '--help')
        return 'help';
    if (arg === '-v' || arg === '--version')
        return 'version';
    return null;
}
function checkCommandKeyword(arg, state) {
    if (CHECK_COMMANDS.has(arg)) {
        state.command = 'check';
        return true;
    }
    if (BOUNDARY_COMMANDS.has(arg)) {
        state.command = 'boundaries';
        return true;
    }
    if (PROMPT_COMMANDS.has(arg)) {
        state.command = 'prompt';
        return true;
    }
    if (ADD_COMMANDS.has(arg)) {
        state.command = 'add';
        return true;
    }
    if (GUARD_COMMANDS.has(arg)) {
        state.command = 'guard';
        return true;
    }
    if (DOCTOR_COMMANDS.has(arg)) {
        state.command = 'doctor';
        return true;
    }
    if (SMOKE_COMMANDS.has(arg)) {
        state.command = 'smoke';
        return true;
    }
    if (PRE_PUSH_COMMANDS.has(arg)) {
        state.command = 'pre-push';
        return true;
    }
    if (COMPLETION_COMMANDS.has(arg)) {
        state.command = 'completion';
        return true;
    }
    if (BOOTSTRAP_COMMANDS.has(arg)) {
        state.command = 'bootstrap';
        return true;
    }
    if (EXPORT_COMMANDS.has(arg)) {
        state.command = 'export';
        return true;
    }
    return false;
}
export function applyArg(state, arg) {
    const special = checkSpecialFlag(arg);
    if (special !== null && state.command !== 'guard')
        return { terminal: special };
    if (state.command === 'guard') {
        if (arg === '-h' || arg === '--help')
            return { terminal: 'help' };
        state.extraArgs = state.extraArgs || [];
        state.extraArgs.push(arg);
        return { terminal: null };
    }
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
    if (checkCommandKeyword(arg, state))
        return { terminal: null };
    if (state.command === 'prompt' && (arg === 'prune' || arg === 'clean')) {
        state.prune = true;
        return { terminal: null };
    }
    if (state.command === 'add') {
        if (!state.packName) {
            state.packName = arg;
            return { terminal: null };
        }
        if (!state.targetDir) {
            state.targetDir = arg;
            return { terminal: null };
        }
    }
    else if (state.command === 'bootstrap' || state.command === 'export') {
        if (!state.targetDir) {
            state.targetDir = arg;
        }
        else {
            state.extraArgs = state.extraArgs || [];
            state.extraArgs.push(arg);
        }
        return { terminal: null };
    }
    else if (!state.targetDir) {
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