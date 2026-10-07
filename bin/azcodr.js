#!/usr/bin/env node
'use strict';

/**
 * CLI entry point. All logic lives in lib/cli.js so it is unit-testable;
 * this file only wires the process boundary (argv in, exit code out).
 */
const cli = require('../lib/cli.js');

if (require.main === module) {
  cli.main();
}

module.exports = cli;
