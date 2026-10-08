#!/usr/bin/env node

/**
 * Cross-platform PreToolUse safety & architectural enforcement hook.
 *
 * Enforces:
 *  1. Command safety (blocks destructive rm, force-push, drop db, etc.)
 *  2. Refactor-Before-Add (blocks adding lines to files over line budget)
 *  3. Test-First / RED-before-GREEN (when enabled)
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const selfDir = path.dirname(fileURLToPath(import.meta.url));
const guardModulePath = path.resolve(selfDir, '../../lib/agent-guard.js');

async function getGuardModule() {
  return import(pathToFileURL(guardModulePath).href);
}

async function readStdin(timeoutMs = 1500) {
  if (process.stdin.isTTY) return '';
  return new Promise((resolve) => {
    let acc = '';
    const timer = setTimeout(() => resolve(acc), timeoutMs);
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => { acc += chunk; });
    process.stdin.on('end', () => {
      clearTimeout(timer);
      resolve(acc);
    });
    process.stdin.on('error', () => {
      clearTimeout(timer);
      resolve(acc);
    });
  });
}

async function main() {
  const argvInput = process.argv.slice(2).join(' ').trim();
  const stdinInput = (await readStdin()).trim();
  const rawInput = argvInput || stdinInput;

  if (!rawInput) {
    process.exit(0);
  }

  const { inspectPreTool } = await getGuardModule();
  const decision = inspectPreTool(rawInput, {
    workspaceRoot: process.cwd()
  });

  if (!decision.allowed) {
    console.error(`🚨 Architectural Guard: ${decision.reason}`);
    process.exit(1);
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
