/**
 * Argument parsing for the azcodr CLI.
 *
 * Table-driven: every boolean flag is one Map entry, so adding a flag cannot
 * raise the complexity of the parser itself.
 */

export interface CliParsedOptions {
  targetDir: string | null;
  force: boolean;
  noGit: boolean;
  dryRun: boolean;
  silent: boolean;
  terminal: 'help' | 'version' | 'unknown-flag' | 'extra-arg' | null;
  message?: string;
}

export type BooleanFlagKey = 'force' | 'noGit' | 'dryRun' | 'silent';

export function emptyOptions(): Omit<CliParsedOptions, 'terminal' | 'message'> {
  return { targetDir: null, force: false, noGit: false, dryRun: false, silent: false };
}

export const BOOLEAN_FLAGS = new Map<string, BooleanFlagKey>([
  ['-f', 'force'],
  ['--force', 'force'],
  ['--no-git', 'noGit'],
  ['-d', 'dryRun'],
  ['--dry-run', 'dryRun'],
  ['-s', 'silent'],
  ['--silent', 'silent']
]);

export interface ArgOutcome {
  terminal: 'help' | 'version' | 'unknown-flag' | 'extra-arg' | null;
  message?: string;
}

export function applyArg(
  state: Omit<CliParsedOptions, 'terminal' | 'message'>,
  arg: string
): ArgOutcome {
  if (arg === '-h' || arg === '--help') return { terminal: 'help' };
  if (arg === '-v' || arg === '--version') return { terminal: 'version' };
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
  if (!state.targetDir) {
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

export default { emptyOptions, BOOLEAN_FLAGS, applyArg, parseArgs };
