import fs from 'node:fs';
import path from 'node:path';
const AZCODR_TEST_NAME_PATTERNS = [
    /^agent-guard.*\.test\.[cm]?[jt]sx?$/,
    /^architecture\.test\.[cm]?[jt]sx?$/,
    /^bootstrap-.*\.test\.[cm]?[jt]sx?$/,
    /^boundaries\.test\.[cm]?[jt]sx?$/,
    /^boundary-guard\.test\.[cm]?[jt]sx?$/,
    /^cli-.*\.test\.[cm]?[jt]sx?$/,
    /^conversation-export\.test\.[cm]?[jt]sx?$/,
    /^coverage-config\.test\.[cm]?[jt]sx?$/,
    /^desktop-doctor\.test\.[cm]?[jt]sx?$/,
    /^error-codes\.test\.[cm]?[jt]sx?$/,
    /^example-project\.test\.[cm]?[jt]sx?$/,
    /^guard-config\.test\.[cm]?[jt]sx?$/,
    /^harness-.*\.test\.[cm]?[jt]sx?$/,
    /^hooks-default\.test\.[cm]?[jt]sx?$/,
    /^index\.test\.[cm]?[jt]sx?$/,
    /^pack\.test\.[cm]?[jt]sx?$/,
    /^pre-push-hook\.test\.[cm]?[jt]sx?$/,
    /^prompt-ledger\.test\.[cm]?[jt]sx?$/,
    /^protected-target.*\.test\.[cm]?[jt]sx?$/,
    /^purge-tests\.test\.[cm]?[jt]sx?$/,
    /^safety-guard\.test\.[cm]?[jt]sx?$/,
    /^scaffold-.*\.test\.[cm]?[jt]sx?$/,
    /^shell-scripts\.test\.[cm]?[jt]sx?$/,
    /^smoke-test\.test\.[cm]?[jt]sx?$/,
    /^supply-chain\.test\.[cm]?[jt]sx?$/,
    /^validate-.*\.test\.[cm]?[jt]sx?$/,
    /^validate\.test\.[cm]?[jt]sx?$/,
    /^workflow\.test\.[cm]?[jt]sx?$/,
    /^yaml-subset\.test\.[cm]?[jt]sx?$/
];
const AZCODR_MARKERS = [
    'azcodr',
    '.agents',
    '../src/',
    '../lib/',
    '../bin/',
    '../scripts/',
    'scripts/pre-push',
    './support/'
];
export function isAzcodrTestFile(fileName, filePath) {
    if (!/\.(test|spec)\.[cm]?[jt]sx?$/.test(fileName))
        return false;
    if (AZCODR_TEST_NAME_PATTERNS.some((p) => p.test(fileName)))
        return true;
    try {
        const head = fs.readFileSync(filePath, 'utf-8').slice(0, 1500);
        return AZCODR_MARKERS.some((m) => head.includes(m));
    }
    catch {
        return false;
    }
}
export function purgeAzcodrTests(targetDir, dryRun = false) {
    const testsDir = path.join(targetDir, 'tests');
    if (!fs.existsSync(testsDir))
        return [];
    const actions = [];
    const entries = fs.readdirSync(testsDir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(testsDir, entry.name);
        if (entry.isFile() && isAzcodrTestFile(entry.name, fullPath)) {
            actions.push(`remove: tests/${entry.name}`);
            if (!dryRun)
                fs.rmSync(fullPath, { force: true });
        }
        else if (entry.isDirectory() && entry.name === 'support') {
            actions.push('remove: tests/support');
            if (!dryRun)
                fs.rmSync(fullPath, { recursive: true, force: true });
        }
    }
    return actions;
}
export default { isAzcodrTestFile, purgeAzcodrTests };
//# sourceMappingURL=purge-tests.js.map