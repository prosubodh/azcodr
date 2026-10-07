'use strict';

/**
 * Argument parsing for the azcodr CLI.
 *
 * Table-driven: every boolean flag is one Map entry, so adding a flag cannot
 * raise the complexity of the parser itself.
 */

function emptyOptions() {
  return { targetDir: null, force: false, noGit: false, dryRun: false, silent: false };
}

const BOOLEAN_FLAGS = new Map([
  ['-f', 'force'],
  ['--force', 'force'],
  ['--no-git', 'noGit'],
  ['-d', 'dryRun'],
  ['--dry-run', 'dryRun'],
  ['-s', 'silent'],
  ['--silent', 'silent']
]);

function applyArg(state, arg) {
  if (arg === '-h' || arg === '--help') return { terminal: 'help' };
  if (arg === '-v' || arg === '--version') return { terminal: 'version' };
  const flag = BOOLEAN_FLAGS.get(arg);
  if (flag !== undefined) {
    state[flag] = true;
    return { terminal: null };
  }
  if (arg.startsWith('-')) {
    return { terminal: 'unknown-flag', message: `Unknown argument '${arg}'. Run 'npx azcodr --help' for available options.` };
  }
  if (!state.targetDir) {
    state.targetDir = arg;
    return { terminal: null };
  }
  return { terminal: 'extra-arg', message: `Unexpected argument '${arg}'. Run 'npx azcodr --help' for available options.` };
}

function parseArgs(rawArgs) {
  const state = emptyOptions();
  for (const arg of rawArgs) {
    const outcome = applyArg(state, arg);
    if (outcome.terminal !== null) return { ...state, terminal: outcome.terminal, message: outcome.message };
  }
  return { ...state, terminal: null, message: undefined };
}

module.exports = { emptyOptions, BOOLEAN_FLAGS, applyArg, parseArgs };
