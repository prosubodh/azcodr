export interface GithubPmInstallOptions {
    dryRun?: boolean;
    force?: boolean;
}
export interface GithubPmInstallResult {
    installed: boolean;
    actions: string[];
    files: string[];
}
export declare function installGithubPmBundle(targetDir: string, options?: GithubPmInstallOptions): GithubPmInstallResult;
declare const _default: {
    installGithubPmBundle: typeof installGithubPmBundle;
    BUNDLE_FILES: readonly string[];
};
export default _default;
//# sourceMappingURL=github-pm.d.ts.map