#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');

// Native threshold flags and include filtering were added in Node v22.8.0.
// Fail closed on older runtimes instead of silently passing without a gate.
const [major, minor] = process.versions.node.split('.').map(Number);
const supportsThresholds = major > 22 || (major === 22 && minor >= 8);
if (!supportsThresholds) {
  console.error(
    `test:coverage requires Node >=22.8.0 for threshold enforcement (current: ${process.versions.node}). ` +
    `Upgrade Node, or invoke the runner directly: node --test --experimental-test-coverage.`
  );
  process.exit(1);
}

const args = [
  '--test',
  '--experimental-test-coverage',
  '--test-coverage-include=bin/**',
  '--test-coverage-include=lib/**',
  // Explicit file, not scripts/**: validate-cli.js is a two-line process entry
  // that only runs when invoked directly, so it cannot be covered in-process.
  // Every other script IS gated.
  '--test-coverage-include=scripts/validate.js',
  '--test-coverage-include=scripts/validate/io.js',
  '--test-coverage-include=scripts/validate/text.js',
  '--test-coverage-include=scripts/validate/parity.js',
  '--test-coverage-include=scripts/validate/adr.js',
  '--test-coverage-include=scripts/validate/root.js',
  '--test-coverage-include=scripts/validate/rules.js',
  '--test-coverage-include=scripts/validate/skills.js',
  '--test-coverage-include=scripts/validate/links.js',
  '--test-coverage-include=scripts/test_coverage.js',
  // bin/, lib/ and test_coverage.js hold no environment-dependent defensive
  // branches and are held at 100%. validate.js is a filesystem auditor: it
  // contains fault handlers for conditions this host cannot produce (creating
  // symlinks requires Developer Mode; a RangeError needs a tree thousands of
  // levels deep). Those are exercised by tests/validate-faults.test.js where
  // the fault can be injected, so the gate here is deliberately lower rather
  // than silently passing.
  '--test-coverage-branches=98',
  '--test-coverage-functions=97',
  '--test-coverage-lines=100'
];

const result = spawnSync(process.execPath, args, {
  stdio: 'inherit',
  env: process.env
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

// A null status means the child was killed by a signal (OOM, SIGKILL from a
// runner timeout). `status ?? 0` reported success for a crashed runner, which
// is how a green build can carry zero coverage data.
if (result.signal) {
  console.error(`test runner terminated by signal ${result.signal}; coverage gate could not be evaluated.`);
  process.exit(1);
}

process.exit(result.status ?? 1);
