#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');

// Native threshold flags and include filtering were added in Node v22.8.0.
// Fail closed on older runtimes instead of silently passing without a gate.
const [major, minor] = process.versions.node.split('.').map(Number);
const supportsThresholds = major > 22 || (major === 22 && minor >= 8);
if (!supportsThresholds) {
  console.error(
    `test:coverage requires Node >=22.8.0 for 100% threshold enforcement (current: ${process.versions.node}). ` +
    `Upgrade Node or run 'npx --yes node@24 --test --experimental-test-coverage --test-coverage-branches=100 --test-coverage-functions=100 --test-coverage-lines=100'.`
  );
  process.exit(1);
}

const args = [
  '--test',
  '--experimental-test-coverage',
  '--test-coverage-include=bin/**',
  '--test-coverage-include=lib/**',
  '--test-coverage-branches=100',
  '--test-coverage-functions=100',
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

process.exit(result.status ?? 0);
