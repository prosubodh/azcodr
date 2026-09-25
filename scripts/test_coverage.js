#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');

const [major, minor] = process.versions.node.split('.').map(Number);
const args = ['--test', '--experimental-test-coverage'];

// Native threshold flags and include filtering were added in Node v22.8.0
if (major > 22 || (major === 22 && minor >= 8)) {
  args.push(
    '--test-coverage-include=bin/**',
    '--test-coverage-include=lib/**',
    '--test-coverage-branches=100',
    '--test-coverage-functions=100',
    '--test-coverage-lines=100'
  );
}

const result = spawnSync(process.execPath, args, {
  stdio: 'inherit',
  env: process.env
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 0);
