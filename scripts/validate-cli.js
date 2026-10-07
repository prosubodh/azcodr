#!/usr/bin/env node
'use strict';

/**
 * CLI entry for the agentic-architecture validator.
 *
 * Deliberately separate from scripts/validate.js: keeping the library free of a
 * `require.main` guard means requiring it never validates or exits, and it
 * avoids a permanently-unreachable branch that blocks the 100% coverage gate.
 */
const { main } = require('./validate.js');

main();