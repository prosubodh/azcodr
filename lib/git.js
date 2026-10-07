'use strict';

const cp = require('node:child_process');
const { ScaffoldError, ERROR_CODES } = require('./errors.js');

/**
 * Socket-hardened process boundary (Supply Chain: shell access).
 * Scaffolder must spawn `git`, but never via a shell string.
 * Uses execFileSync with argv (shell:false) and an explicit subcommand allowlist.
 * No network, no env exfiltration; cwd is constrained to targetDir callers.
 */
const GIT_ALLOWED_SUBCOMMANDS = new Set(['rev-parse', 'init', 'branch', 'add', 'commit']);

function runGit(args, options = {}) {
  if (!Array.isArray(args) || args.length === 0) {
    throw new ScaffoldError('E_GIT_ARGS_INVALID', ERROR_CODES.E_GIT_ARGS_INVALID);
  }
  if (!GIT_ALLOWED_SUBCOMMANDS.has(args[0])) {
    throw new ScaffoldError('E_GIT_BLOCKED', `${ERROR_CODES.E_GIT_BLOCKED}: ${String(args[0])}`);
  }
  return cp.execFileSync('git', args, {
    encoding: 'utf-8',
    stdio: 'pipe',
    shell: false,
    ...options
  });
}

module.exports = { GIT_ALLOWED_SUBCOMMANDS, runGit };
