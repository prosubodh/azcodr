import type { FailFn, ValidationContext } from './types.js';
/**
 * Extracts and validates a skill's front-matter block.
 *
 * @param content - Full SKILL.md contents.
 * @param skill - Skill directory name.
 * @param fail - Failure reporter.
 * @returns The front-matter block, or null when it is unusable.
 */
export declare function frontMatterBlock(content: string, skill: string, fail: FailFn): string | null;
/**
 * Reads the description, folding YAML block scalars into one line.
 *
 * Reading only the `>-` marker measured a 2-character description and defeated
 * the context-budget cap entirely.
 *
 * @param frontMatter - The front-matter block.
 * @returns The description text.
 */
export declare function extractSkillDescription(frontMatter: string): string;
/**
 * Validates one skill directory.
 *
 * @param skill - Skill directory name.
 * @param skillsDir - Parent skills directory.
 * @param ctx - Validation context.
 */
export declare function checkOneSkill(skill: string, skillsDir: string, ctx: ValidationContext): void;
/**
 * Validates every skill a workspace chose to install.
 *
 * @param ctx - Validation context.
 * @returns Number of skills validated.
 */
export declare function phaseSkills(ctx: ValidationContext): number;
//# sourceMappingURL=skills.d.ts.map