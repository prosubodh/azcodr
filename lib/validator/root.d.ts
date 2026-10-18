import type { ValidationContext } from './types.js';
declare function checkParity(filePath: string, label: string, ctx: ValidationContext): void;
/**
 * Verifies that any harness-parity files a project uses agree.
 *
 * @param ctx - Validation context.
 */
export declare function checkHarnessParity(ctx: ValidationContext): void;
/**
 * Phase 1: the root agent contract and harness parity.
 *
 * @param ctx - Validation context.
 */
export declare function phaseRootConfig(ctx: ValidationContext): void;
export { checkParity };
//# sourceMappingURL=root.d.ts.map