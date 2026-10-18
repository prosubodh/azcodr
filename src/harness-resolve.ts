import fs from 'node:fs';
import path from 'node:path';
import { CORE_CHECK_IDS, KNOWN_CHECK_IDS } from './harness-config.js';
import type {
  AppliesWhen,
  CheckDeclaration,
  HarnessConfig,
  ProjectFacts,
  Severity
} from './harness-config.js';

/**
 * A check id together with everything needed to decide whether it runs.
 */
export interface ResolvedCheck {
  /** The check identifier. */
  id: string;
  /** Whether the check is active for this project. */
  enabled: boolean;
  /** Effective enforcement level. */
  severity: Severity;
  /** True when the check is a non-removable safety invariant. */
  core: boolean;
  /** True when configuration attempted to disable a core check. */
  overridden: boolean;
  /** Why the check resolved the way it did. */
  reason: string;
  /** Which condition produced the decision. */
  matchedBy: string;
  /** Free-form parameters handed to the checker. */
  params: Record<string, unknown>;
  /** Layer rules for `layer-boundaries`; empty means the check cannot report. */
  layers: Record<string, string[]>;
  /** Conditional gating that produced the decision. */
  applies: AppliesWhen;
  /** Decides whether a specific file is in scope. */
  enabledFor: (filePath: string) => boolean;
}

const NO_APPLIES: AppliesWhen = { paths: [], exclude: [], languages: [], has: [], changed_only: false };

function toPosix(value: string): string {
  return value.replace(/\\/g, '/');
}

function convertStar(pattern: string, i: number): { token: string; advance: number } {
  if (pattern[i + 1] !== '*') return { token: '[^/]*', advance: 0 };
  if (pattern[i + 2] === '/') return { token: '(?:.*/)?', advance: 2 };
  return { token: '.*', advance: 1 };
}

function convertGlobTokens(pattern: string): string {
  let out = '';
  for (let i = 0; i < pattern.length; i += 1) {
    const ch = pattern[i] as string;
    if (ch === '*') {
      const res = convertStar(pattern, i);
      out += res.token;
      i += res.advance;
      continue;
    }
    if (ch === '?') { out += '[^/]'; continue; }
    if ('.+^${}()|[]\\'.includes(ch)) { out += `\\${ch}`; continue; }
    out += ch;
  }
  return out;
}

function globToRegExp(pattern: string): RegExp {
  const anchored = pattern.startsWith('**');
  const out = convertGlobTokens(pattern);
  return new RegExp(anchored ? `^${out}$` : `(?:^|/)${out}$`);
}

/**
 * Matches a repo-relative path against a single glob pattern.
 *
 * @param filePath - Path relative to the repository root.
 * @param pattern - Glob supporting `*`, `**` and `?`.
 * @returns True when the path matches.
 */
export function matchGlob(filePath: string, pattern: string): boolean {
  return globToRegExp(pattern).test(toPosix(filePath));
}

/**
 * Matches a path against any pattern in a list.
 *
 * @param filePath - Path relative to the repository root.
 * @param patterns - Glob patterns to test.
 * @returns True when at least one pattern matches.
 */
export function matchesAny(filePath: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => matchGlob(filePath, pattern));
}

function pathGate(applies: AppliesWhen, facts: ProjectFacts): (filePath: string) => boolean {
  const changedSet = new Set((facts.changed ?? []).map(toPosix));
  return (filePath: string) => {
    const rel = toPosix(filePath);
    if (applies.exclude.length > 0 && matchesAny(rel, applies.exclude)) return false;
    if (applies.changed_only && !changedSet.has(rel)) return false;
    if (applies.paths.length === 0) return true;
    return matchesAny(rel, applies.paths);
  };
}

function disabled(id: string, reason: string, matchedBy: string): ResolvedCheck {
  return {
    id,
    enabled: false,
    severity: 'off',
    core: false,
    overridden: false,
    reason,
    matchedBy,
    params: {},
    layers: {},
    applies: NO_APPLIES,
    enabledFor: () => false
  };
}

function checkConditions(
  decl: CheckDeclaration,
  facts: ProjectFacts
): { enabled: boolean; reason: string; matchedBy: string } | null {
  if (!decl.enabled) {
    return { enabled: false, reason: 'declared with enabled: false', matchedBy: 'enabled:false' };
  }
  if (decl.severity === 'off') {
    return { enabled: false, reason: 'declared with severity: off', matchedBy: 'severity:off' };
  }

  const langs = decl.applies_when.languages;
  if (langs.length > 0) {
    const declared = facts.languages.map((l) => l.toLowerCase());
    if (!langs.some((l) => declared.includes(l.toLowerCase()))) {
      return {
        enabled: false,
        reason: `languages gate [${langs.join(', ')}] does not match project languages [${facts.languages.join(', ') || 'none'}]`,
        matchedBy: 'languages'
      };
    }
  }

  const has = decl.applies_when.has;
  const missing = has.filter((rel) => !facts.root || !fs.existsSync(path.join(facts.root, rel)));
  if (missing.length > 0) {
    return { enabled: false, reason: `requires path(s) that do not exist: ${missing.join(', ')}`, matchedBy: 'has' };
  }
  return null;
}

function fromDeclaration(decl: CheckDeclaration, facts: ProjectFacts): ResolvedCheck {
  const base = {
    id: decl.id,
    severity: decl.severity,
    core: false,
    overridden: false,
    params: decl.params,
    layers: decl.layers ?? {},
    applies: decl.applies_when,
    enabledFor: pathGate(decl.applies_when, facts)
  };

  const outcome = checkConditions(decl, facts);
  if (outcome) return { ...base, ...outcome };
  return { ...base, enabled: true, reason: 'declared and enabled', matchedBy: 'declared' };
}

function isOverridden(decl: CheckDeclaration | undefined): boolean {
  if (!decl) return false;
  return !decl.enabled || decl.severity === 'off';
}

function coreCheck(id: string, decl: CheckDeclaration | undefined, facts: ProjectFacts): ResolvedCheck {
  const overridden = isOverridden(decl);
  const gate = decl ? pathGate(decl.applies_when, facts) : () => true;
  return {
    id,
    enabled: true,
    severity: 'error',
    core: true,
    overridden,
    params: decl?.params ?? {},
    layers: decl?.layers ?? {},
    applies: decl?.applies_when ?? NO_APPLIES,
    enabledFor: gate,
    reason: overridden
      ? 'core safety check; configuration attempted to disable it and was overridden'
      : 'core safety check; not user-removable',
    matchedBy: 'core'
  };
}

function ids(config: HarnessConfig): string[] {
  return [...new Set([...KNOWN_CHECK_IDS, ...config.checks.map((c) => c.id)])];
}

/**
 * Resolves every known check against declared project facts.
 *
 * Checks absent from the configuration resolve to disabled rather than absent,
 * so `explain` can always report a verdict. A malformed rule set disables the
 * offending check and records why; it never blocks a project on a parser quirk.
 *
 * @param config - The loaded configuration.
 * @param facts - Project facts used to evaluate conditional gates.
 * @returns A map of check id to its resolution.
 */
export function resolveChecks(config: HarnessConfig, facts: ProjectFacts): Map<string, ResolvedCheck> {
  const byId = new Map(config.checks.map((c) => [c.id, c]));
  const out = new Map<string, ResolvedCheck>();

  for (const id of ids(config)) {
    const decl = byId.get(id);
    if (CORE_CHECK_IDS.includes(id)) {
      out.set(id, coreCheck(id, decl, facts));
      continue;
    }
    if (!decl) {
      out.set(id, disabled(id, 'not declared in configuration', 'undeclared'));
      continue;
    }
    try {
      out.set(id, fromDeclaration(decl, facts));
    } catch (err) {
      out.set(id, disabled(id, `invalid declaration: ${(err as Error).message}`, 'invalid'));
    }
  }

  return out;
}

/**
 * Renders a human-readable explanation of one check's resolution.
 *
 * @param report - A map produced by resolveChecks.
 * @param id - Check identifier to explain.
 * @returns Multi-line explanation suitable for terminal output.
 */
export function explainCheck(report: Map<string, ResolvedCheck>, id: string): string {
  const check = report.get(id);
  if (!check) return `${id}: unknown check id.`;
  const lines = [
    `check: ${id}`,
    `  enabled:  ${check.enabled}`,
    `  severity: ${check.severity}`,
    `  reason:   ${check.reason}`
  ];
  if (check.overridden) lines.push('  note:     a core safety check cannot be disabled by configuration');
  const gate = check.applies;
  if (gate.paths.length > 0) lines.push(`  paths:    ${gate.paths.join(', ')}`);
  if (gate.exclude.length > 0) lines.push(`  exclude:  ${gate.exclude.join(', ')}`);
  if (gate.languages.length > 0) lines.push(`  languages: ${gate.languages.join(', ')}`);
  return lines.join('\n');
}

export default { resolveChecks, explainCheck, matchGlob, matchesAny };
