import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const BUNDLE_FILES = [
    'ISSUE_TEMPLATE/bug_report.yml',
    'ISSUE_TEMPLATE/feature_request.yml',
    'ISSUE_TEMPLATE/adr_proposal.yml',
    'ISSUE_TEMPLATE/config.yml',
    'pull_request_template.md',
    'CODEOWNERS',
    'dependabot.yml',
    'release.yml',
    'DISCUSSION_TEMPLATE/adr.md',
    'github-project-management.md'
];
function resolveSourcePath(relativePath) {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    return path.resolve(currentDir, '..', 'data', 'github-pm', relativePath);
}
function resolveDestPath(targetDir, relativePath) {
    if (relativePath === 'github-project-management.md') {
        return path.join(targetDir, 'docs', 'github-project-management.md');
    }
    return path.join(targetDir, '.github', relativePath);
}
export function installGithubPmBundle(targetDir, options = {}) {
    const actions = [];
    const files = [];
    let installed = false;
    for (const relativePath of BUNDLE_FILES) {
        const src = resolveSourcePath(relativePath);
        if (!fs.existsSync(src))
            continue;
        const dest = resolveDestPath(targetDir, relativePath);
        const displayPath = path.relative(targetDir, dest).replace(/\\/g, '/');
        if (fs.existsSync(dest) && !options.force) {
            actions.push(`skip: ${displayPath} (already exists)`);
            continue;
        }
        actions.push(`install: ${displayPath}`);
        files.push(displayPath);
        installed = true;
        if (options.dryRun)
            continue;
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
    }
    return { installed, actions, files };
}
export default { installGithubPmBundle, BUNDLE_FILES };
//# sourceMappingURL=github-pm.js.map