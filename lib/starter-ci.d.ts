/**
 * azcodr's own release workflows. They target this repository's build and
 * publish path and must never run inside a scaffolded project;
 * `writeStarterCi` removes them from the target and installs a starter CI.
 */
export declare const AZCODR_DEV_WORKFLOWS: readonly string[];
/**
 * Starter governance CI written into every scaffolded project.
 *
 * It runs the published toolkit, so it is green out of the box and stays valid
 * as the toolkit improves. A project that wants its own test, lint or coverage
 * gates adds those steps from its own `harness.yaml`.
 */
export declare const STARTER_CI = "name: ci\n\non:\n  push:\n    branches: [main]\n  pull_request:\n\npermissions:\n  contents: read\n\njobs:\n  governance:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 22.x\n      - name: Workspace check\n        run: npx --yes azcodr check --silent\n";
/**
 * Writes the starter governance CI into a scaffold target and removes azcodr's
 * own dev workflows from it, so a generated project's CI is green out of the
 * box instead of calling scripts a fresh project does not have.
 *
 * @param resolvedTarget - Absolute path to the scaffold target directory.
 * @param dryRun - Record the action without touching the filesystem.
 * @returns Recorded scaffolding action descriptions.
 */
export declare function writeStarterCi(resolvedTarget: string, dryRun: boolean): string[];
declare const _default: {
    STARTER_CI: string;
    AZCODR_DEV_WORKFLOWS: readonly string[];
    writeStarterCi: typeof writeStarterCi;
};
export default _default;
//# sourceMappingURL=starter-ci.d.ts.map