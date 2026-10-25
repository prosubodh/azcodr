/** Issue tracking surface. */
export type IssueTrackingMode = 'local' | 'github' | 'both';
/** ADR hosting surface. */
export type AdrHostingMode = 'repo' | 'discussions' | 'both';
export interface GithubPmConfig {
    issueTracking: IssueTrackingMode;
    adrHosting: AdrHostingMode;
    prGovernance: boolean;
}
export declare function defaultGithubPmConfig(): GithubPmConfig;
export declare function asIssueTrackingMode(value: unknown): IssueTrackingMode;
export declare function asAdrHostingMode(value: unknown): AdrHostingMode;
export declare function parseGithubPm(raw: unknown): GithubPmConfig;
declare const _default: {
    defaultGithubPmConfig: typeof defaultGithubPmConfig;
    asIssueTrackingMode: typeof asIssueTrackingMode;
    asAdrHostingMode: typeof asAdrHostingMode;
    parseGithubPm: typeof parseGithubPm;
};
export default _default;
//# sourceMappingURL=harness-github-pm.d.ts.map