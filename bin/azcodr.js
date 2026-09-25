#!/usr/bin/env node
'use strict';

const path = require('node:path');
const readline = require('node:readline');
const { scaffold, logChange, getTemplateDir } = require('../lib/scaffold.js');
const pkg = require('../package.json');

const args = process.argv.slice(2);

function printHelp() {
  console.log(`
azcodr v${pkg.version}
Enterprise Multi-Tenant Architecture & Agentic Engineering Starter Template

Usage:
  npx azcodr [directory] [options]
  npx azcodr change <title> [options]

Commands:
  [directory]     Scaffold azcodr template into directory (default: current directory)
  change <title>  Log a generic architectural change to changes.md

Scaffold Options:
  -f, --force     Overwrite existing files in target directory without confirmation
  --no-git        Do not initialize a git repository
  -v, --version   Display version number
  -h, --help      Display this help message

Change Options:
  -c, --category  Category (Rule | Skill | Infrastructure | CLI | Knowledge Hub)
  -f, --files     Target file(s) affected (e.g. "docs/rules/caching.md")
  -r, --rationale Rationale for upstream template incorporation
  -d, --desc      Detailed description of the change

Examples:
  npx azcodr my-project
  npx azcodr . --force
  npx azcodr change "Add Wasm plugin interface" -c Architecture
`);
}

function printVersion() {
  console.log(pkg.version);
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function handleLogChange() {
  let title = null;
  let category = 'Architecture';
  let targetFiles = 'docs/rules/';
  let rationale = 'Generic architectural enhancement';
  let description = '';

  for (let i = 1; i < args.length; i++) {
    const a = args[i];
    if (a === '-c' || a === '--category') {
      category = args[++i] || category;
    } else if (a === '-f' || a === '--files') {
      targetFiles = args[++i] || targetFiles;
    } else if (a === '-r' || a === '--rationale') {
      rationale = args[++i] || rationale;
    } else if (a === '-d' || a === '--desc' || a === '--description') {
      description = args[++i] || description;
    } else if (!a.startsWith('-')) {
      if (!title) {
        title = a;
      }
    }
  }

  if (!title) {
    if (process.stdin.isTTY) {
      title = await askQuestion('? Change title: ');
    }
  }

  if (!title) {
    console.error('❌ Error: A title is required to log an upstream change.');
    console.error('Usage: npx azcodr change "<title>" [-c Category] [-f Files] [-r Rationale] [-d Description]');
    process.exit(1);
  }

  try {
    const res = logChange({
      title,
      category,
      targetFiles,
      rationale,
      description,
      targetDir: process.cwd()
    });
    console.log(`\n✅ Upstream change logged to ${res.filePath}\n`);
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ Failed to log change: ${err.message}\n`);
    process.exit(1);
  }
}

async function main() {
  if (args.length > 0 && (args[0] === '-h' || args[0] === '--help')) {
    printHelp();
    process.exit(0);
  }

  if (args.length > 0 && (args[0] === '-v' || args[0] === '--version')) {
    printVersion();
    process.exit(0);
  }

  if (args.length > 0 && (args[0] === 'change' || args[0] === 'log-change')) {
    await handleLogChange();
    return;
  }

  let targetDir = null;
  let force = false;
  let noGit = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    } else if (arg === '-v' || arg === '--version') {
      printVersion();
      process.exit(0);
    } else if (arg === '-f' || arg === '--force') {
      force = true;
    } else if (arg === '--no-git') {
      noGit = true;
    } else if (!arg.startsWith('-')) {
      if (!targetDir) {
        targetDir = arg;
      }
    }
  }

  console.log('\n🚀 azcodr - Enterprise Multi-Tenant Architecture & Agentic Engineering\n');

  if (!targetDir) {
    if (process.stdin.isTTY) {
      const answer = await askQuestion('? Where would you like to initialize your project? (./) ');
      targetDir = answer || '.';
    } else {
      targetDir = '.';
    }
  }

  const resolvedTarget = path.resolve(process.cwd(), targetDir);
  const templateDir = getTemplateDir();

  if (resolvedTarget === templateDir) {
    console.error(`❌ Error: Cannot scaffold into the template directory itself: ${resolvedTarget}`);
    process.exit(1);
  }

  const fs = require('node:fs');
  if (fs.existsSync(resolvedTarget)) {
    const entries = fs.readdirSync(resolvedTarget);
    if (entries.length > 0 && !force) {
      if (process.stdin.isTTY) {
        const confirm = await askQuestion(
          `⚠️  Target directory '${targetDir}' is not empty (${entries.length} items). Continue? (y/N) `
        );
        if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
          console.log('Scaffolding aborted.');
          process.exit(0);
        }
        force = true;
      } else {
        console.error(
          `❌ Error: Target directory '${resolvedTarget}' is not empty. Use --force to proceed.`
        );
        process.exit(1);
      }
    }
  }

  console.log(`📦 Scaffolding azcodr into: ${resolvedTarget}`);

  try {
    const result = scaffold({
      targetDir: resolvedTarget,
      force,
      noGit,
      templateDir
    });

    console.log('  ✅ Progressive disclosure rules copied (docs/rules/)');
    console.log('  ✅ Workspace knowledge hub and ADR ledger copied (docs/knowledge/, memory.md)');
    console.log('  ✅ Specialized agentic skills copied (.agents/skills/)');
    console.log('  ✅ Upstream changes ledger initialized (changes.md)');
    console.log('  ✅ Agent directives and harness symlinks established (AGENTS.md, CLAUDE.md, agents.md)');
    if (result.gitInitialized) {
      console.log('  ✅ Git repository initialized');
    }

    console.log('\n🎉 azcodr initialized successfully!\n');
    console.log('Next steps:');
    if (targetDir !== '.' && targetDir !== './') {
      console.log(`  1. cd ${targetDir}`);
    }
    console.log('  2. Open the project in your AI coding assistant (Antigravity, Claude Code, Cursor, OpenHands)');
    console.log('  3. Run /lets-build to start the architectural interview and scaffold your application stack!\n');
  } catch (err) {
    console.error(`\n❌ Scaffolding failed: ${err.message}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
