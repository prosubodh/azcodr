/**
 * Argument parsing for the azcodr CLI.
 *
 * Table-driven: every boolean flag is one Map entry, so adding a flag cannot
 * raise the complexity of the parser itself.
 */

export type CliCommand = 'scaffold' | 'check' | 'boundaries' | 'prompt' | 'add';

export interface CliParsedOptions {
  command: CliCommand;
  targetDir: string | null;
  packName?: string | null;
  prune?: boolean;
  force: boolean;
  noGit: boolean;
  dryRun: boolean;
  silent: boolean;
  terminal: 'help' | 'version' | 'unknown-flag' | 'extra-arg' | null;
  message?: string;
}

export type BooleanFlagKey = 'force' | 'noGit' | 'dryRun' | 'silent' | 'prune';

export function emptyOptions(): Omit<CliParsedOptions, 'terminal' | 'message'> {
  return {
    command: 'scaffold',
    targetDir: null,
    packName: null,
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

export const BOOLEAN_FLAGS = new Map<string, BooleanFlagKey>([
  ['-f', 'force'],
  ['--force', 'force'],
  ['--no-git', 'noGit'],
  ['-d', 'dryRun'],
  ['--dry-run', 'dryRun'],
  ['-s', 'silent'],
  ['--silent', 'silent'],
  ['--prune', 'prune']
]);

export interface ArgOutcome {
  terminal: 'help' | 'version' | 'unknown-flag' | 'extra-arg' | null;
  message?: string;
}

function checkSpecialFlag(arg: string): 'help' | 'version' | null {
  if (arg === '-h' || arg === '--help') return 'help';
  if (arg === '-v' || arg === '--version') return 'version';
  return null;
}

function checkCommandKeyword(
  arg: string,
  state: Omit<CliParsedOptions, 'terminal' | 'message'>
): boolean {
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
  return false;
}

export function applyArg(
  state: Omit<CliParsedOptions, 'terminal' | 'message'>,
  arg: string
): ArgOutcome {
  const special = checkSpecialFlag(arg);
  if (special !== null) return { terminal: special };
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
  if (checkCommandKeyword(arg, state)) return { terminal: null };
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
  } else if (!state.targetDir) {
    state.targetDir = arg;
    return { terminal: null };
  }
  return {
    terminal: 'extra-arg',
    message: `Unexpected argument '${arg}'. Run 'npx azcodr --help' for available options.`
  };
}

export function parseArgs(rawArgs: readonly string[]): CliParsedOptions {
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
