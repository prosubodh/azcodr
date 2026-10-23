#!/usr/bin/env node

/**
 * Git pre-push hook enforcing the azcodr generic law:
 * Prohibits direct push to protected branches (main, master, staging, uat, prod, release/*, client/*).
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

export const DEFAULT_PROTECTED_BRANCHES = ['main', 'master'];

export function isBranchProtected(branch, patterns) {
  const normalized = branch.trim();
  for (const pattern of patterns) {
    const p = pattern.trim();
    if (!p) continue;
    if (p.includes('*')) {
      const escaped = p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
      if (new RegExp(`^${escaped}$`, 'i').test(normalized)) return true;
    } else if (normalized.toLowerCase() === p.toLowerCase()) {
      return true;
    }
  }
  return false;
}

export function parseProtectedBranchesFromHarness(content) {
  const branches = [];
  const match = content.match(/id:\s*protected-branches[\s\S]*?branches:([ \t]*\r?\n(?:[ \t]+-[^\r\n]*\r?\n?)+)/m);
  if (match && match[1]) {
    for (const line of match[1].split(/\r?\n/)) {
      const itemMatch = line.match(/^\s*-\s*["']?([^"'\r\n]+)["']?/);
      if (itemMatch && itemMatch[1]) branches.push(itemMatch[1].trim());
    }
  }
  return branches;
}

export function resolveProtectedBranches(cwd = process.cwd()) {
  const env = process.env.AZCODR_PROTECTED_BRANCHES;
  if (env && env.trim().length > 0) {
    return env.split(',').map((s) => s.trim()).filter(Boolean);
  }

  for (const name of ['harness.yaml', 'harness.yml', 'azcodr.yaml']) {
    const p = path.join(cwd, name);
    if (fs.existsSync(p)) {
      try {
        const parsed = parseProtectedBranchesFromHarness(fs.readFileSync(p, 'utf-8'));
        if (parsed.length > 0) return parsed;
      } catch {
        // Fall through on read or parse failure
      }
    }
  }

  return DEFAULT_PROTECTED_BRANCHES;
}

export function evaluatePushedRefs(stdinContent, protectedPatterns) {
  const lines = stdinContent.trim().split(/\r?\n/).filter(Boolean);
  const violations = [];

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 3) continue;
    const remoteRef = parts[2];
    const branchName = remoteRef.replace(/^refs\/heads\//, '').trim();

    if (isBranchProtected(branchName, protectedPatterns)) {
      violations.push(branchName);
    }
  }

  return violations;
}

async function readAllStdin() {
  if (process.stdin.isTTY) return '';
  return new Promise((resolve) => {
    let acc = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => { acc += chunk; });
    process.stdin.on('end', () => resolve(acc));
    process.stdin.on('error', () => resolve(acc));
  });
}

export async function runHook() {
  const input = await readAllStdin();
  const protectedPatterns = resolveProtectedBranches();
  const violations = evaluatePushedRefs(input, protectedPatterns);

  if (violations.length > 0) {
    console.error('\n🚨 DIRECT PUSH TO PROTECTED BRANCH BLOCKED:');
    for (const b of violations) {
      console.error(`   - Target branch '${b}' is protected by azcodr governance.`);
    }
    console.error('   Pushing directly to protected branches is forbidden.');
    console.error('   Remedy: create a topic branch and merge via Pull Request.\n');
    process.exit(1);
  }

  process.exit(0);
}

if (process.argv[1] && process.argv[1].endsWith('pre-push.js')) {
  runHook();
}
