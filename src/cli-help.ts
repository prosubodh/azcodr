import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface PackageJsonShape {
  version: string;
}

const pkg: PackageJsonShape = JSON.parse(
  fs.readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'package.json'),
    'utf-8'
  )
);

export function printHelp(out: (msg: string) => void = console.log): void {
  out(`
azcodr v${pkg.version}
Architecture governance toolkit: boundary & cycle detection, fail-closed validation

Usage:
  npx azcodr [directory] [options]
  npx azcodr check [directory] [options]
  npx azcodr boundaries [directory] [options]
  npx azcodr prompt [directory] [options]
  npx azcodr add <pack> [directory]
  npx azcodr <command> [directory] [args...]

Commands:
  [directory]            Scaffold azcodr into directory (default: current directory)
  check [directory]      Validate architecture and governance rules (alias: validate, audit)
  boundaries [directory] Inspect dependency cycles and layer boundaries (alias: boundary, cycles)
  prompt [prune] [dir]   Check prompt ledger integrity or delete completed ledger (alias: ledger)
  add <pack>             Install a governance capability pack (TDD, boundaries, coverage, etc.)
  guard [dir] [args...]  Execute agent guard enforcement on commands or file changes
  doctor [dir]           Verify environment health, toolchain prerequisites, and paths
  smoke [dir]            Run fast smoke tests across workspace integration points
  pre-push [dir]         Run pre-push validation gates (lint, types, tests, governance)
  completion [dir]       Verify completion criteria and prompt ledger resolution
  bootstrap [dir]        Bootstrap workspace topology and domain structure
  export <file> [out]    Export and format agent conversation transcripts

Options:
  -d, --dry-run   Simulate scaffolding without modifying filesystem
  -s, --silent    Suppress console output messages
  -f, --force     Overwrite existing files in target directory without confirmation
  --no-git        Do not initialize a git repository
  --prune         Delete prompt ledger if all directives are completed
  -v, --version   Display version number
  -h, --help      Display this help message

Examples:
  npx azcodr my-project
  npx azcodr check
  npx azcodr boundaries ./src
  npx azcodr check ./existing-repo
  npx azcodr . --dry-run
  npx azcodr add tdd
  npx azcodr guard --command "npm test"
  npx azcodr doctor
`);
}

export function printVersion(out: (msg: string) => void = console.log): void {
  out(pkg.version);
}

export default { printHelp, printVersion };
