#!/usr/bin/env node

/**
 * CLI entry point. All logic lives in lib/cli.js so it is unit-testable;
 * this file only wires the process boundary (argv in, exit code out).
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import * as cli from '../lib/cli.js';

const isDirectRun = process.argv[1] ? fs.realpathSync(path.resolve(process.argv[1])).toLowerCase() === fs.realpathSync(import.meta.filename).toLowerCase() : false;

if (isDirectRun) {
  cli.main();
}

export * from '../lib/cli.js';
export default cli;
