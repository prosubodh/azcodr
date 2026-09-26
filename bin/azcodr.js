#!/usr/bin/env node
'use strict';

const path = require('node:path');
const readline = require('node:readline');
const fs = require('node:fs');
const { scaffold, getTemplateDir } = require('../lib/scaffold.js');
const pkg = require('../package.json');

function printHelp(out = console.log) {
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

function printVersion(out = console.log) {
  out(pkg.version);
}

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

async function runCli(rawArgs = process.argv.slice(2), io = {}) {
  const {
    out = console.log,
    err = console.error,
    exit = process.exit,
    stdin = process.stdin,
    stdout = process.stdout,
    cwd = process.cwd(),
    templateDir = getTemplateDir(),
    scaffold: scaffoldFn = scaffold
  } = io;

  let targetDir = null;
  let force = false;
  let noGit = false;
  let dryRun = false;
  let silent = false;

  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    if (arg === '-h' || arg === '--help') {
      printHelp(out);
      return exit(0);
    } else if (arg === '-v' || arg === '--version') {
      printVersion(out);
      return exit(0);
    } else if (arg === '-f' || arg === '--force') {
      force = true;
    } else if (arg === '--no-git') {
      noGit = true;
    } else if (arg === '-d' || arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '-s' || arg === '--silent') {
      silent = true;
    } else if (arg.startsWith('-')) {
      err(`❌ Error: Unknown argument '${arg}'. Run 'npx azcodr --help' for available options.`);
      return exit(1);
    } else if (!targetDir) {
      targetDir = arg;
    }
  }

  if (!silent) {
    out('\n🚀 azcodr - Enterprise Multi-Tenant Architecture & Agentic Engineering\n');
  }

  if (!targetDir) {
    if (stdin.isTTY) {
      const answer = await askQuestion('? Where would you like to initialize your project? (./) ', {
        input: stdin,
        output: stdout
      });
      targetDir = answer || '.';
    } else {
      targetDir = '.';
    }
  }

  const resolvedTarget = path.resolve(cwd, targetDir);

  if (resolvedTarget === templateDir) {
    err(`❌ Error: Cannot scaffold into the template directory itself: ${resolvedTarget}`);
    return exit(1);
  }

  if (fs.existsSync(resolvedTarget)) {
    const stat = fs.statSync(resolvedTarget);
    if (!stat.isDirectory()) {
      err(`❌ Error: Target '${resolvedTarget}' already exists and is not a directory.`);
      return exit(1);
    }
    const entries = fs.readdirSync(resolvedTarget);
    if (entries.length > 0 && !force) {
      if (stdin.isTTY) {
        const confirm = await askQuestion(
          `⚠️  Target directory '${targetDir}' is not empty (${entries.length} items). Continue? (y/N) `,
          { input: stdin, output: stdout }
        );
        if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
          out('Scaffolding aborted.');
          return exit(0);
        }
        force = true;
      } else {
        err(`❌ Error: Target directory '${resolvedTarget}' is not empty. Use --force to proceed.`);
        return exit(1);
      }
    }
  }

  if (dryRun) {
    if (!silent) {
      out(`🔍 DRY RUN: Simulating azcodr scaffolding into: ${resolvedTarget}\n`);
    }
  } else if (!silent) {
    out(`📦 Scaffolding azcodr into: ${resolvedTarget}`);
  }

  try {
    const result = scaffoldFn({
      targetDir: resolvedTarget,
      force,
      noGit,
      templateDir,
      dryRun,
      silent
    });

    if (dryRun) {
      if (!silent) {
        for (const action of result.actions) {
          out(`  [preview] ${action}`);
        }
        out('\n🎉 Dry run completed. 0 files modified on disk.\n');
      }
      return exit(0);
    }

    if (!silent) {
      out('  ✅ Progressive disclosure rules copied (docs/rules/)');
      out('  ✅ Workspace knowledge hub and ADR ledger copied (docs/knowledge/, memory.md)');
      out('  ✅ Specialized agentic skills copied (.agents/skills/)');
      out('  ✅ Editor formatting standards initialized (.editorconfig)');
      out('  ✅ Agent directives and harness symlinks established (AGENTS.md, CLAUDE.md, agents.md, GEMINI.md, .cursorrules, .windsurfrules)');
      if (result.gitInitialized) {
        out('  ✅ Git repository initialized');
      }

      out('\n🎉 azcodr initialized successfully!\n');
      out('Next steps:');
      if (targetDir !== '.' && targetDir !== './') {
        out(`  1. cd ${targetDir}`);
      }
      out('  2. Open the project in your AI coding assistant (Antigravity, Claude Code, Cursor, OpenHands)');
      out('  3. Run /lets-build to start the architectural interview and scaffold your application stack!\n');
    }
    return exit(0);
  } catch (error) {
    err(`\n❌ Scaffolding failed: ${error.message}\n`);
    return exit(1);
  }
}

async function main() {
  try {
    await runCli(process.argv.slice(2));
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  runCli,
  askQuestion,
  printHelp,
  printVersion,
  main
};
