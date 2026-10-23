import fs from 'node:fs';
import path from 'node:path';
import { readTextOrFail, walkMarkdown } from './io.js';
import { stripFencedCode } from './text.js';
import type { ValidationContext } from './types.js';

/**
 * Validates the documentation rules a workspace chose to maintain.
 *
 * Absence is a skip: a project that keeps no rule catalogue is not defective.
 *
 * @param ctx - Validation context.
 * @returns Number of rule files validated.
 */
export function phaseRules(ctx: ValidationContext): number {
  ctx.log('');
  ctx.heading('2. Checking Documentation Rules...');
  const rulesDir = path.join(ctx.workspaceRoot, 'docs', 'rules');
  if (!fs.existsSync(rulesDir) || !fs.statSync(rulesDir).isDirectory()) {
    ctx.skip('No docs/rules directory present; skipping rules validation.');
    return 0;
  }

  // Recurse, and match the extension case-insensitively. A flat readdir misses
  // docs/rules/sub/*.md and *.MD entirely, so the reported count would lie.
  const files = walkMarkdown(rulesDir, 'rule', ctx.fail);
  for (const file of files) checkOneRule(file, path.relative(rulesDir, file), ctx);

  if (files.length === 0) {
    ctx.fail('docs/rules contains no .md rule files; progressive disclosure has nothing to disclose.');
  } else {
    ctx.pass(`Validated ${files.length} modular rule files in docs/rules/.`);
  }
  return files.length;
}

/**
 * Structural checks for one rule file.
 *
 * Strip fenced code so a documentation example cannot satisfy a structural
 * check by being quoted inside the document.
 *
 * @param filePath - Rule file to check.
 * @param name - Display name relative to docs/rules.
 * @param ctx - Validation context.
 */
export function checkOneRule(filePath: string, name: string, ctx: ValidationContext): void {
  const content = readTextOrFail(filePath, `Rule ${name}`, ctx.fail);
  if (content === null) return;

  const structural = stripFencedCode(content);
  if (!/^# /m.test(structural)) ctx.fail(`Rule ${name} missing H1 header (# Title)`);
  if (!/^> \*\*Core Mandate:\*\*/m.test(structural)) {
    ctx.warn(`Rule ${name} missing standardized '> **Core Mandate:**' summary`);
  }
  if (fs.statSync(filePath).size > 24000) {
    ctx.warn(`Rule ${name} exceeds 24KB token-economy cap (${fs.statSync(filePath).size} bytes)`);
  }
}