/**
 * Command safety guard inspecting shell commands against a destructive denylist.
 */

/**
 * Represents the result of evaluating a shell command against the safety denylist.
 */
export interface CommandViolation {
  /** Whether the command is prohibited by the safety denylist. */
  blocked: boolean;
  /** Explanatory rationale if the command is blocked. */
  reason?: string;
  /** Normalized command string evaluated. */
  command?: string;
}

/**
 * Denylist pattern definition matching prohibited shell commands.
 */
export interface DenylistRule {
  /** Regular expression pattern detecting prohibited command syntax. */
  pattern: RegExp;
  /** Human-readable explanation of why the command is unsafe. */
  reason: string;
}

export const DESTRUCTIVE_RULES: readonly DenylistRule[] = [
  {
    pattern: /\brm\s+(-[a-z-]*[rf][a-z-]*\s+)+(\/|\/\*|~|~\/\*|\$home|\$\{home\}|\.|\.\.|\.\/|[a-z]:\\|[a-z]:\/)/i,
    reason: 'destructive rm targeting root, home, drive, or the current directory'
  },
  {
    pattern: /(^|\s)rm\s+(-[a-z-]*\s+)*(\/|~|[a-z]:\\|[a-z]:\/)($|\s)/i,
    reason: 'destructive rm targeting root or home'
  },
  {
    pattern: /\brm\s+--recursive.*--force\s+(\/|~|\$home|\.)/i,
    reason: 'destructive rm using long-form flags'
  },
  {
    pattern: /\brm\s+.*--no-preserve-root/i,
    reason: 'rm --no-preserve-root is forbidden under agent execution'
  },
  {
    pattern: /\b(wipefs\s+-a|shred\s+-u|find\s+.*-delete)\b/i,
    reason: 'irreversible disk or mass-delete operation'
  },
  {
    pattern: /\bgit\s+push\s+.*(-f|--force|--mirror)\b/i,
    reason: 'force-push or mirror-push can destroy remote history'
  },
  {
    pattern: /\bgit\s+push\b.*--force-with-lease\b/i,
    reason: 'force-push variant detected'
  },
  {
    pattern: /\bgit\s+(reset\s+--hard|clean\s+-[a-z]*[fd])/i,
    reason: 'destructive git worktree operation (reset --hard / clean)'
  },
  {
    pattern: /\bgit\s+checkout\s+--\s+\./i,
    reason: 'git checkout -- . discards all uncommitted work'
  },
  {
    pattern: /\bgit\s+branch\s+-D\b/i,
    reason: 'force branch delete'
  },
  {
    pattern: /\b(drop\s+(database|schema|table)|truncate\s+(table\s+)?[a-z_])/i,
    reason: 'destructive SQL DDL'
  },
  {
    pattern: /\b(delete\s+from|update\s+[a-z_]+\s+set|alter\s+table)\b/i,
    reason: 'destructive SQL DML'
  },
  {
    pattern: /\b(grant\s+all|revoke\s+all)\b/i,
    reason: 'privilege escalation in SQL'
  },
  {
    pattern: /\b(mkfs|dd\s+if=|fdisk|parted\s+\/dev)\b/i,
    reason: 'raw disk operation'
  },
  {
    pattern: /(:[\s]*\([\s]*\)[\s]*\{|:[\s]*\x7c[\s]*:[\s]*&)/,
    reason: 'fork bomb'
  },
  {
    pattern: /\b(curl|wget)\s+.*\|\s*(sudo\s+)?(ba)?sh\b/i,
    reason: 'piping download directly into shell execution'
  },
  {
    pattern: /\b(base64\s+-d|base64\s+--decode)\s+.*\|/i,
    reason: 'decoding encoded payload into a pipe'
  },
  {
    pattern: /\b(npm|yarn|pnpm)\s+publish\b/i,
    reason: 'package publish must run via release workflow, not ad-hoc tool call'
  }
];

export const DEFAULT_PROTECTED_BRANCHES: readonly string[] = ['main', 'master'];

export interface InspectCommandOptions {
  protectedBranches?: readonly string[];
  currentBranch?: string;
}

export function isBranchProtected(branch: string, patterns: readonly string[]): boolean {
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

function resolveProtectedBranches(options?: InspectCommandOptions): readonly string[] {
  if (options?.protectedBranches && options.protectedBranches.length > 0) {
    return options.protectedBranches;
  }
  const env = process.env.AZCODR_PROTECTED_BRANCHES;
  if (env && env.trim().length > 0) {
    return env.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
  }
  return DEFAULT_PROTECTED_BRANCHES;
}

export function extractPushTargetBranches(command: string): string[] {
  const norm = normalizeCommand(command);
  const match = norm.match(/\bgit\s+push\b(.*)$/i);
  if (!match || !match[1]) return [];

  const rawArgs = match[1].trim().split(/\s+/).filter(Boolean);
  if (rawArgs.some((a) => a === '--all')) return ['*'];

  const nonFlagArgs = rawArgs.filter((a) => !a.startsWith('-'));
  if (nonFlagArgs.length === 0) return [];

  const targets: string[] = [];
  const refspecs = nonFlagArgs.length >= 2 ? nonFlagArgs.slice(1) : nonFlagArgs;

  for (const ref of refspecs) {
    if (ref === 'origin' || ref === 'upstream') continue;
    let target = ref;
    if (target.includes(':')) {
      target = target.split(':').pop() ?? target;
    }
    target = target.replace(/^\+/, '').replace(/^refs\/heads\//, '').trim();
    if (target.length > 0) targets.push(target);
  }
  return targets;
}

function checkProtectedBranchPush(
  normalized: string,
  options?: InspectCommandOptions
): CommandViolation | null {
  if (!/\bgit\s+push\b/i.test(normalized)) return null;

  const protectedBranches = resolveProtectedBranches(options);
  const targets = extractPushTargetBranches(normalized);

  if (targets.length === 0 && options?.currentBranch) {
    if (isBranchProtected(options.currentBranch, protectedBranches)) {
      return {
        blocked: true,
        reason: `direct push from protected branch ('${options.currentBranch}') is forbidden; use feature branches and pull requests`,
        command: normalized.slice(0, 300)
      };
    }
    return null;
  }

  for (const target of targets) {
    if (target === '*' || isBranchProtected(target, protectedBranches)) {
      return {
        blocked: true,
        reason: `direct push to protected branch ('${target}') is forbidden; use feature branches and pull requests`,
        command: normalized.slice(0, 300)
      };
    }
  }

  return null;
}

/**
 * Collapses multi-line strings and extra whitespace into a single normalized shell command string.
 *
 * @param raw - Raw command string.
 * @returns Cleaned single-line command string.
 */
export function normalizeCommand(raw: string): string {
  return raw.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Checks a command string against the safety denylist.
 *
 * @param command - Raw shell command string.
 * @param options - Optional inspection options (e.g. protectedBranches, currentBranch).
 * @returns Violation details if blocked, or clean outcome.
 */
export function inspectCommand(
  command: string,
  options?: InspectCommandOptions
): CommandViolation {
  const normalized = normalizeCommand(command);
  if (!normalized) return { blocked: false };

  for (const rule of DESTRUCTIVE_RULES) {
    if (rule.pattern.test(normalized)) {
      return {
        blocked: true,
        reason: rule.reason,
        command: normalized.slice(0, 300)
      };
    }
  }

  const branchViolation = checkProtectedBranchPush(normalized, options);
  if (branchViolation) return branchViolation;

  return { blocked: false, command: normalized };
}

export default {
  DESTRUCTIVE_RULES,
  DEFAULT_PROTECTED_BRANCHES,
  normalizeCommand,
  isBranchProtected,
  extractPushTargetBranches,
  inspectCommand
};
