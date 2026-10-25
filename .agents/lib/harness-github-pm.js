import { HarnessConfigError } from './harness-error.js';
const DEFAULT_GITHUB_PM = {
    issueTracking: 'github',
    adrHosting: 'repo',
    prGovernance: true
};
export function defaultGithubPmConfig() {
    return { ...DEFAULT_GITHUB_PM };
}
function asRecord(value, label) {
    if (value === null || value === undefined)
        return {};
    if (typeof value !== 'object' || Array.isArray(value)) {
        throw new HarnessConfigError(`${label} must be a mapping`);
    }
    return value;
}
export function asIssueTrackingMode(value) {
    const allowed = ['local', 'github', 'both'];
    if (value === undefined)
        return 'github';
    if (typeof value === 'string' && allowed.includes(value))
        return value;
    throw new HarnessConfigError(`issueTracking must be one of ${allowed.join(', ')} (received ${JSON.stringify(value)})`);
}
export function asAdrHostingMode(value) {
    const allowed = ['repo', 'discussions', 'both'];
    if (value === undefined)
        return 'repo';
    if (typeof value === 'string' && allowed.includes(value))
        return value;
    throw new HarnessConfigError(`adrHosting must be one of ${allowed.join(', ')} (received ${JSON.stringify(value)})`);
}
export function parseGithubPm(raw) {
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
//# sourceMappingURL=harness-github-pm.js.map