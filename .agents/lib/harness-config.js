import fs from 'node:fs';
import path from 'node:path';
import { parseYamlSubset } from './yaml-subset.js';
import { HarnessConfigError } from './harness-error.js';
import { defaultGithubPmConfig, parseGithubPm } from './harness-github-pm.js';
export { HarnessConfigError };
export { defaultGithubPmConfig };
/**
 * Config file names searched, in order, at a workspace root.
 */
export const CONFIG_FILE_NAMES = ['harness.yaml', 'harness.yml', 'azcodr.yaml'];
/** Schema version understood by this release. */
export const SUPPORTED_VERSION = 1;
/**
 * Checks that are always active and cannot be switched off by configuration.
 * These are destructive-action safety invariants, not methodology.
 */
export const CORE_CHECK_IDS = [
    'destructive-commands',
    'protected-targets',
    'dependency-cycles'
];
/**
 * Optional checks a project may declare. None are enabled by default; each is
 * methodology or tooling policy that a dissenting project simply omits.
 */
export const OPTIONAL_CHECK_IDS = [
    'max-file-lines',
    'layer-boundaries',
    'red-before-green',
    'coverage-floor',
    'markdown-links',
    'adr-envelope'
];
/**
 * Every check id the resolver can produce a verdict for.
 */
export const KNOWN_CHECK_IDS = [...CORE_CHECK_IDS, ...OPTIONAL_CHECK_IDS];
const EMPTY_APPLIES = { paths: [], exclude: [], languages: [], has: [], changed_only: false };
export function defaultConfig() {
    return {
        version: SUPPORTED_VERSION,
        project: { languages: [], commands: {} },
        methodology: 'none',
        packs: [],
        github: defaultGithubPmConfig(),
        checks: [],
        source: null
    };
}
function asRecord(value, label) {
    if (value === null || value === undefined)
        return {};
    if (typeof value !== 'object' || Array.isArray(value)) {
        throw new HarnessConfigError(`${label} must be a mapping`);
    }
    return value;
}
function asStringList(value, label) {
    if (value === null || value === undefined)
        return [];
    if (!Array.isArray(value))
        throw new HarnessConfigError(`${label} must be a list`);
    return value.map((item, i) => {
        if (typeof item !== 'string')
            throw new HarnessConfigError(`${label}[${i}] must be a string`);
        return item;
    });
}
function asSeverity(value) {
    if (value === undefined)
        return 'error';
    if (value === 'error' || value === 'warn' || value === 'off')
        return value;
    throw new HarnessConfigError(`severity must be one of error, warn, off (received ${JSON.stringify(value)})`);
}
function asMethodology(value) {
    const allowed = ['none', 'tdd', 'bdd', 'contract-first', 'property-based', 'custom'];
    if (value === undefined)
        return 'none';
    if (typeof value === 'string' && allowed.includes(value))
        return value;
    throw new HarnessConfigError(`methodology must be one of ${allowed.join(', ')} (received ${JSON.stringify(value)})`);
}
function parseAppliesWhen(raw, owner) {
    const obj = asRecord(raw, 'checks[].applies_when');
    const merged = { ...EMPTY_APPLIES };
    for (const field of ['paths', 'exclude', 'languages', 'has']) {
        const short = owner[field];
        if (short !== undefined)
            merged[field] = asStringList(short, `checks[].${field}`);
        if (obj[field] !== undefined)
            merged[field] = asStringList(obj[field], `applies_when.${field}`);
    }
    merged.changed_only = obj.changed_only === true || owner.changed_only === true;
    return merged;
}
function parseLayers(raw) {
    if (raw === null || raw === undefined)
        return null;
    const obj = asRecord(raw, 'checks[].layers');
    const out = {};
    for (const [layer, forbidden] of Object.entries(obj)) {
        out[layer] = asStringList(forbidden, `layers.${layer}`);
    }
    return out;
}
function parseCheck(raw) {
    const obj = asRecord(raw, 'checks[] entry');
    const id = obj.id;
    if (typeof id !== 'string' || id.trim() === '') {
        throw new HarnessConfigError('every check entry requires a non-empty string id');
    }
    return {
        id,
        enabled: obj.enabled !== false,
        severity: asSeverity(obj.severity),
        params: asRecord(obj.params, `checks[${id}].params`),
        applies_when: parseAppliesWhen(obj.applies_when, obj),
        layers: parseLayers(obj.layers)
    };
}
function parseProject(raw) {
    const obj = asRecord(raw, 'project');
    const commandsRaw = asRecord(obj.commands, 'project.commands');
    const commands = {};
    for (const [key, value] of Object.entries(commandsRaw)) {
        commands[key] = asStringList(value, `project.commands.${key}`);
    }
    return { languages: asStringList(obj.languages, 'project.languages'), commands };
}
/**
 * Validates an already-parsed document into a typed configuration.
 *
 * @param source - Raw `harness.yaml` text.
 * @returns The validated configuration.
 * @throws {HarnessConfigError} When any field is missing or malformed.
 */
export function parseHarnessConfig(source) {
    let doc;
    try {
        doc = parseYamlSubset(source);
    }
    catch (err) {
        const yamlErr = err;
        throw new HarnessConfigError(`${yamlErr.message}. Supported YAML subset: mappings, lists, flow collections, plain and quoted scalars.`, yamlErr.line);
    }
    const version = doc.version === undefined ? SUPPORTED_VERSION : doc.version;
    if (version !== SUPPORTED_VERSION) {
        throw new HarnessConfigError(`unsupported schema version ${JSON.stringify(version)}; this build understands ${SUPPORTED_VERSION}`);
    }
    const checksRaw = doc.checks === undefined ? [] : doc.checks;
    if (!Array.isArray(checksRaw))
        throw new HarnessConfigError('checks must be a list');
    const github = doc.github === undefined ? defaultGithubPmConfig() : parseGithubPm(doc.github);
    return {
        version,
        project: parseProject(doc.project),
        methodology: asMethodology(doc.methodology),
        packs: asStringList(doc.packs, 'packs'),
        github,
        checks: checksRaw.map(parseCheck),
        source: null
    };
}
/**
 * Locates and loads the configuration for a workspace root.
 *
 * A workspace with no configuration file is not an error: it yields the
 * neutral default, which declares no optional checks.
 *
 * @param root - Workspace directory to search.
 * @returns The loaded configuration, or the neutral default when none exists.
 * @throws {HarnessConfigError} When a config file exists but is unusable.
 */
export function loadHarnessConfig(root) {
    for (const name of CONFIG_FILE_NAMES) {
        const file = path.join(root, name);
        if (!fs.existsSync(file))
            continue;
        try {
            return { ...parseHarnessConfig(fs.readFileSync(file, 'utf-8')), source: name };
        }
        catch (err) {
            if (err instanceof HarnessConfigError) {
                throw new HarnessConfigError(`${name}: ${err.message}`, err.line);
            }
            const msg = err.message;
            throw new HarnessConfigError(`cannot read ${name}: ${msg}`);
        }
    }
    return defaultConfig();
}
export default { loadHarnessConfig, parseHarnessConfig, defaultConfig, HarnessConfigError };
//# sourceMappingURL=harness-config.js.map