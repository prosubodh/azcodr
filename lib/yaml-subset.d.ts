import { YamlSubsetError } from './yaml-flow.js';
export { YamlSubsetError };
/**
 * Parses the supported YAML subset used by `harness.yaml`.
 *
 * Supports block mappings, block sequences, inline flow collections, plain and
 * quoted scalars, and comments. Anchors, aliases, explicit tags and block
 * scalars are rejected explicitly rather than approximated, so an unsupported
 * construct can never be silently misread as a different value.
 *
 * @param source - Raw document text.
 * @returns The parsed document, always a mapping at the root.
 * @throws {YamlSubsetError} When input uses an unsupported construct or is malformed.
 */
export declare function parseYamlSubset(source: string): Record<string, unknown>;
declare const _default: {
    parseYamlSubset: typeof parseYamlSubset;
    YamlSubsetError: typeof YamlSubsetError;
};
export default _default;
//# sourceMappingURL=yaml-subset.d.ts.map