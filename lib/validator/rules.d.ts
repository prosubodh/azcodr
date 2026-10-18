import type { ValidationContext } from './types.js';
/**
 * Validates the documentation rules a workspace chose to maintain.
 *
 * Absence is a skip: a project that keeps no rule catalogue is not defective.
 *
 * @param ctx - Validation context.
 * @returns Number of rule files validated.
 */
export declare function phaseRules(ctx: ValidationContext): number;
/**
 * Structural checks for one rule file.
 *
 * Strip fenced code so a documentation example cannot satisfy a structural
 * check by being quoted inside the document.
 *
 * @param filePath - Rule file to check.
 * @param name - Display name relative to docs/rules.
 * @param ctx - Validation context.
 */
export declare function checkOneRule(filePath: string, name: string, ctx: ValidationContext): void;
//# sourceMappingURL=rules.d.ts.map