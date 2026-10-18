import fs from 'node:fs';
import path from 'node:path';
/**
 * azcodr's own release workflows. They target this repository's build and
 * publish path and must never run inside a scaffolded project;
 * `writeStarterCi` removes them from the target and installs a starter CI.
 */
export const AZCODR_DEV_WORKFLOWS = ['ci.yml', 'publish.yml'];
/**
 * Starter governance CI written into every scaffolded project.
 *
 * It runs the published toolkit, so it is green out of the box and stays valid
 * as the toolkit improves. A project that wants its own test, lint or coverage
 * gates adds those steps from its own `harness.yaml`.
 */
export const STARTER_CI = `name: ci

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

jobs:
  governance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22.x
      - name: Workspace check
        run: npx --yes azcodr check --silent
`;
/**
 * Writes the starter governance CI into a scaffold target and removes azcodr's
 * own dev workflows from it, so a generated project's CI is green out of the
 * box instead of calling scripts a fresh project does not have.
 *
 * @param resolvedTarget - Absolute path to the scaffold target directory.
 * @param dryRun - Record the action without touching the filesystem.
 * @returns Recorded scaffolding action descriptions.
 */
export function writeStarterCi(resolvedTarget, dryRun) {
    const actions = ['generate: .github/workflows/ci.yml (starter governance CI)'];
    if (dryRun)
        return actions;
    const workflowsDir = path.join(resolvedTarget, '.github', 'workflows');
    fs.mkdirSync(workflowsDir, { recursive: true });
    for (const name of AZCODR_DEV_WORKFLOWS) {
        fs.rmSync(path.join(workflowsDir, name), { force: true });
    }
    fs.writeFileSync(path.join(workflowsDir, 'ci.yml'), STARTER_CI, 'utf-8');
    return actions;
}
export default { STARTER_CI, AZCODR_DEV_WORKFLOWS, writeStarterCi };
//# sourceMappingURL=starter-ci.js.map