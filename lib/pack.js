import fs from 'node:fs';
import path from 'node:path';
import { CONFIG_FILE_NAMES } from './harness-config.js';
import { installPrePushHook } from './repo.js';
import { installWorkflowTemplate } from './workflow.js';
const CANONICAL_PACKS = {
    tdd: {
        name: 'tdd',
        description: 'Test-Driven Development (enforces red-before-green test nano-cycles)',
        methodology: 'tdd',
        checks: [{ id: 'red-before-green', enabled: true, severity: 'error' }]
    },
    boundaries: {
        name: 'boundaries',
        description: 'Architectural layer boundaries and dependency cycle prevention',
        checks: [{ id: 'layer-boundaries', enabled: true, severity: 'error' }]
    },
    coverage: {
        name: 'coverage',
        description: '100% full-stack test coverage floor across statement, branch, function, and line metrics',
        checks: [{ id: 'coverage-floor', enabled: true, severity: 'error' }]
    },
    'clean-code': {
        name: 'clean-code',
        description: 'Clean Code fitness functions (300 lines/file, small functions, max 3 params)',
        checks: [{ id: 'max-file-lines', enabled: true, severity: 'error', params: { max: 300 } }]
    },
    docker: {
        name: 'docker',
        description: 'Containerization governance and docker safety standards'
    },
    adr: {
        name: 'adr',
        description: 'Architectural Decision Record envelope and index consistency',
        checks: [{ id: 'adr-envelope', enabled: true, severity: 'error' }]
    },
    links: {
        name: 'links',
        description: 'Internal Markdown link and reference integrity verification',
        checks: [{ id: 'markdown-links', enabled: true, severity: 'error' }]
    },
    'pre-push': {
        name: 'pre-push',
        description: 'Git pre-push hook preventing direct push to protected branches',
        checks: [{ id: 'protected-branches', enabled: true, severity: 'error', params: { branches: ['main', 'master'] } }]
    },
    ci: {
        name: 'ci',
        description: 'Continuous Integration GitHub Actions workflow with governance and test gates'
    },
    'publish-workflow': {
        name: 'publish-workflow',
        description: 'Automated GitHub Actions release & publishing workflow with provenance attestations'
    }
};
const PACK_ALIASES = {
    'test-driven': 'tdd',
    'boundary-guard': 'boundaries',
    cycles: 'boundaries',
    'coverage-floor': 'coverage',
    cleancode: 'clean-code',
    container: 'docker',
    'pre-push-guard': 'pre-push',
    hook: 'pre-push',
    hooks: 'pre-push',
    'github-ci': 'ci',
    actions: 'ci',
    workflows: 'ci',
    workflow: 'ci',
    'ci-workflow': 'ci',
    publish: 'publish-workflow',
    'publish-action': 'publish-workflow',
    'release-workflow': 'publish-workflow'
};
export const KNOWN_PACK_NAMES = Object.keys(CANONICAL_PACKS);
export function getPackDefinition(rawName) {
    const normalized = rawName.trim().toLowerCase();
    const canonical = PACK_ALIASES[normalized] ?? normalized;
    const found = CANONICAL_PACKS[canonical];
    if (found)
        return found;
    return {
        name: canonical,
        description: `Custom capability pack: ${canonical}`
    };
}
function findOrCreateConfigPath(targetDir) {
    for (const name of CONFIG_FILE_NAMES) {
        const candidate = path.join(targetDir, name);
        if (fs.existsSync(candidate))
            return candidate;
    }
    return path.join(targetDir, CONFIG_FILE_NAMES[0]);
}
function formatCheckYaml(check) {
    let lines = `  - id: ${check.id}\n    enabled: true`;
    if (check.severity)
        lines += `\n    severity: ${check.severity}`;
    if (check.params) {
        lines += '\n    params:';
        for (const [k, v] of Object.entries(check.params)) {
            lines += `\n      ${k}: ${JSON.stringify(v)}`;
        }
    }
    return lines;
}
function generateInitialYaml(pack) {
    let yaml = `version: 1\n`;
    if (pack.methodology) {
        yaml += `methodology: ${pack.methodology}\n`;
    }
    yaml += `packs:\n  - ${pack.name}\n`;
    if (pack.checks && pack.checks.length > 0) {
        yaml += `checks:\n`;
        for (const check of pack.checks) {
            yaml += `${formatCheckYaml(check)}\n`;
        }
    }
    return yaml;
}
function appendToPacks(content, packName) {
    if (/^packs:\s*\[(.*?)\]/m.test(content)) {
        return content.replace(/^packs:\s*\[(.*?)\]/m, (_, inner) => {
            const items = inner.trim().length > 0 ? `${inner.trim()}, ${packName}` : packName;
            return `packs: [${items}]`;
        });
    }
    const withItems = content.match(/^packs:([ \t]*\r?\n(?:[ \t]+-[^\r\n]*\r?\n?)+)/m);
    if (withItems) {
        return content.replace(withItems[0], `${withItems[0].trimEnd()}\n  - ${packName}\n`);
    }
    const emptyPacks = content.match(/^packs:[ \t]*\r?\n?/m);
    if (emptyPacks) {
        return content.replace(emptyPacks[0], `packs:\n  - ${packName}\n`);
    }
    return `${content.trimEnd()}\n\npacks:\n  - ${packName}\n`;
}
function appendToChecks(content, check) {
    const checkYaml = formatCheckYaml(check);
    const withChecks = content.match(/^checks:([ \t]*\r?\n(?:[ \t]+[^\r\n]*\r?\n?)+)/m);
    if (withChecks) {
        return content.replace(withChecks[0], `${withChecks[0].trimEnd()}\n${checkYaml}\n`);
    }
    const emptyChecks = content.match(/^checks:[ \t]*\r?\n?/m);
    if (emptyChecks) {
        return content.replace(emptyChecks[0], `checks:\n${checkYaml}\n`);
    }
    return `${content.trimEnd()}\n\nchecks:\n${checkYaml}\n`;
}
function updateExistingYaml(content, pack) {
    let updated = appendToPacks(content, pack.name);
    const actions = [`add pack: ${pack.name}`];
    if (pack.methodology && /^methodology:\s*none/m.test(updated)) {
        updated = updated.replace(/^methodology:\s*none/m, `methodology: ${pack.methodology}`);
        actions.push(`set methodology: ${pack.methodology}`);
    }
    if (pack.checks) {
        for (const check of pack.checks) {
            if (!new RegExp(`- id:\\s*${check.id}\\b`).test(updated)) {
                updated = appendToChecks(updated, check);
                actions.push(`enable check: ${check.id}`);
            }
        }
    }
    return { updated, actions };
}
function executePackSideEffects(targetDir, packName, options) {
    const actions = [];
    if (packName === 'pre-push') {
        const hookResult = installPrePushHook(targetDir, { dryRun: options.dryRun, force: options.force });
        if (hookResult.action)
            actions.push(hookResult.action);
    }
    else if (packName === 'ci') {
        const wfResult = installWorkflowTemplate(targetDir, 'ci', { dryRun: options.dryRun, force: options.force });
        if (wfResult.action)
            actions.push(wfResult.action);
    }
    else if (packName === 'publish-workflow') {
        const wfResult = installWorkflowTemplate(targetDir, 'publish', { dryRun: options.dryRun, force: options.force });
        if (wfResult.action)
            actions.push(wfResult.action);
    }
    return actions;
}
export function installPack(targetDir, packName, options = {}) {
    const pack = getPackDefinition(packName);
    const configPath = findOrCreateConfigPath(targetDir);
    const exists = fs.existsSync(configPath);
    if (!exists) {
        const yaml = generateInitialYaml(pack);
        const actions = [`create: ${path.basename(configPath)}`, `add pack: ${pack.name}`];
        if (pack.checks) {
            actions.push(...pack.checks.map((c) => `enable check: ${c.id}`));
        }
        const sideEffects = executePackSideEffects(targetDir, pack.name, options);
        actions.push(...sideEffects);
        if (!options.dryRun) {
            fs.mkdirSync(path.dirname(configPath), { recursive: true });
            fs.writeFileSync(configPath, yaml, 'utf-8');
        }
        return { packName: pack.name, configPath, alreadyInstalled: false, actions };
    }
    const existingContent = fs.readFileSync(configPath, 'utf-8');
    const alreadyHas = new RegExp(`-\\s*${pack.name}\\b`).test(existingContent) ||
        new RegExp(`\\[[^\\]]*\\b${pack.name}\\b[^\\]]*\\]`).test(existingContent);
    if (alreadyHas) {
        if (options.force) {
            const sideEffects = executePackSideEffects(targetDir, pack.name, options);
            return { packName: pack.name, configPath, alreadyInstalled: false, actions: sideEffects };
        }
        return { packName: pack.name, configPath, alreadyInstalled: true, actions: [] };
    }
    const { updated, actions } = updateExistingYaml(existingContent, pack);
    const sideEffects = executePackSideEffects(targetDir, pack.name, options);
    actions.push(...sideEffects);
    if (!options.dryRun) {
        fs.writeFileSync(configPath, updated, 'utf-8');
    }
    return { packName: pack.name, configPath, alreadyInstalled: false, actions };
}
//# sourceMappingURL=pack.js.map