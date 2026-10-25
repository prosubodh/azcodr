import { HarnessConfigError } from './harness-error.js';

/** Issue tracking surface. */
export type IssueTrackingMode = 'local' | 'github' | 'both';

/** ADR hosting surface. */
export type AdrHostingMode = 'repo' | 'discussions' | 'both';

export interface GithubPmConfig {
  issueTracking: IssueTrackingMode;
  adrHosting: AdrHostingMode;
  prGovernance: boolean;
}

const DEFAULT_GITHUB_PM: GithubPmConfig = {
  issueTracking: 'github',
  adrHosting: 'repo',
  prGovernance: true
};

export function defaultGithubPmConfig(): GithubPmConfig {
  return { ...DEFAULT_GITHUB_PM };
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || value === undefined) return {};
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new HarnessConfigError(`${label} must be a mapping`);
  }
  return value as Record<string, unknown>;
}

export function asIssueTrackingMode(value: unknown): IssueTrackingMode {
  const allowed: IssueTrackingMode[] = ['local', 'github', 'both'];
  if (value === undefined) return 'github';
  if (typeof value === 'string' && (allowed as string[]).includes(value)) return value as IssueTrackingMode;
  throw new HarnessConfigError(
    `issueTracking must be one of ${allowed.join(', ')} (received ${JSON.stringify(value)})`
  );
}

export function asAdrHostingMode(value: unknown): AdrHostingMode {
  const allowed: AdrHostingMode[] = ['repo', 'discussions', 'both'];
  if (value === undefined) return 'repo';
  if (typeof value === 'string' && (allowed as string[]).includes(value)) return value as AdrHostingMode;
  throw new HarnessConfigError(
    `adrHosting must be one of ${allowed.join(', ')} (received ${JSON.stringify(value)})`
  );
}

export function parseGithubPm(raw: unknown): GithubPmConfig {
  const obj = asRecord(raw, 'github');
  return {
    issueTracking: asIssueTrackingMode(obj.issueTracking),
    adrHosting: asAdrHostingMode(obj.adrHosting),
    prGovernance: obj.prGovernance !== false
  };
}

export default {
  defaultGithubPmConfig,
  asIssueTrackingMode,
  asAdrHostingMode,
  parseGithubPm
};
