'use strict';

const path = require('node:path');
const readline = require('node:readline');
const fs = require('node:fs');
const { isProtectedTarget } = require('./guards.js');

function askQuestion(query, { input = process.stdin, output = process.stdout } = {}) {
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

async function promptForTargetDir(io) {
  const { stdin, stdout } = io;
  if (!stdin.isTTY) return '.';
  const answer = await askQuestion('? Where would you like to initialize your project? (./) ', {
    input: stdin,
    output: stdout
  });
  return answer || '.';
}

function rejectBadTarget(resolvedTarget, templateDir) {
  if (resolvedTarget === templateDir) {
    return `Cannot scaffold into the template directory itself: ${resolvedTarget}`;
  }
  // Fail fast on protected locations BEFORE the non-empty prompt. The prompt
  // asks "Continue? (y/N)" for ordinary project directories; answering "y"
  // for ~ or / must not be possible. The library enforces this again in
  // validateTarget, so this is defence in depth, not the sole check.
  if (isProtectedTarget(resolvedTarget, { templateDir })) {
    return `Refusing to scaffold into protected directory: ${resolvedTarget}. Choose a project subdirectory instead.`;
  }
  return null;
}

async function resolveTargetDir(targetDir, io) {
  const { cwd, templateDir } = io;
  const chosen = targetDir || await promptForTargetDir(io);
  const resolvedTarget = path.resolve(cwd, chosen);
  const rejection = rejectBadTarget(resolvedTarget, templateDir);
  if (rejection !== null) return { resolvedTarget, chosen, error: rejection };
  return { resolvedTarget, chosen, error: null };
}

function targetStatus(resolvedTarget) {
  if (!fs.existsSync(resolvedTarget)) return { status: 'missing', count: 0 };
  if (!fs.statSync(resolvedTarget).isDirectory()) return { status: 'not-a-directory', count: 0 };
  const count = fs.readdirSync(resolvedTarget).length;
  return { status: count === 0 ? 'empty' : 'non-empty', count };
}

async function confirmOverwrite(targetDir, count, io) {
  const { stdin, stdout, out } = io;
  if (!stdin.isTTY) return { confirmed: false, aborted: false };
  const confirm = await askQuestion(
    `⚠️  Target directory '${targetDir}' is not empty (${count} items). Continue? (y/N) `,
    { input: stdin, output: stdout }
  );
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
async function ensureWritableTarget({ chosen, resolvedTarget, force, io }) {
  const { err } = io;
  const { status, count } = targetStatus(resolvedTarget);
  if (status === 'missing' || status === 'empty' || force) return { force };
  if (status === 'not-a-directory') {
    return { exitCode: 1, message: `Target '${resolvedTarget}' already exists and is not a directory.` };
  }
  const { confirmed, aborted } = await confirmOverwrite(chosen, count, io);
  if (aborted) return { exitCode: 0, message: null };
  if (confirmed) return { force: true };
  err(`Target directory '${resolvedTarget}' is not empty. Use --force to proceed.`);
  return { exitCode: 1, message: null };
}

module.exports = {
  askQuestion,
  promptForTargetDir,
  rejectBadTarget,
  resolveTargetDir,
  targetStatus,
  confirmOverwrite,
  ensureWritableTarget
};
