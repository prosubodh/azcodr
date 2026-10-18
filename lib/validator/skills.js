import fs from 'node:fs';
import path from 'node:path';
import { readTextOrFail, readSkillFolders } from './io.js';
/** Bounds a skill file must stay inside for an agent to load it cheaply. */
const MAX_SKILL_LINES = 500;
const MAX_DESCRIPTION_CHARS = 1024;
/**
 * Extracts and validates a skill's front-matter block.
 *
 * @param content - Full SKILL.md contents.
 * @param skill - Skill directory name.
 * @param fail - Failure reporter.
 * @returns The front-matter block, or null when it is unusable.
 */
export function frontMatterBlock(content, skill, fail) {
    const lines = content.split('\n');
    if (lines[0]?.trim() !== '---') {
        fail(`Skill '${skill}' missing opening front matter delimiter (---)`);
        return null;
    }
    const closing = lines.slice(1).findIndex((line) => line.trim() === '---');
    if (closing === -1) {
        fail(`Skill '${skill}' missing closing front matter delimiter (---)`);
        return null;
    }
    // Scope metadata lookups to the front matter only: searching the whole file
    // let body prose or a fenced example satisfy these checks.
    const block = lines.slice(1, closing + 1).join('\n');
    const name = block.match(/^name:\s*(.+)$/m);
    if (!name || name[1]?.trim() !== skill) {
        fail(`Skill '${skill}' front matter 'name:' does not match directory name`);
        return null;
    }
    return block;
}
/**
 * Reads the description, folding YAML block scalars into one line.
 *
 * Reading only the `>-` marker measured a 2-character description and defeated
 * the context-budget cap entirely.
 *
 * @param frontMatter - The front-matter block.
 * @returns The description text.
 */
export function extractSkillDescription(frontMatter) {
    const match = frontMatter.match(/^description:\s*(.+)$/m);
    const marker = match?.[1]?.trim() ?? '';
    if (!match)
        return '';
    if (!/^[>|][-+]?$/.test(marker))
        return marker;
    const after = frontMatter.slice(frontMatter.indexOf(match[0]) + match[0].length);
    return after
        .split('\n')
        .filter((line) => /^\s+\S/.test(line))
        .map((line) => line.trim())
        .join(' ')
        .trim();
}
function checkDescription(desc, skill, ctx) {
    if (!desc) {
        ctx.fail(`Skill '${skill}' missing front matter 'description:'`);
        return;
    }
    if (!/^Use when/i.test(desc)) {
        ctx.warn(`Skill '${skill}' description should start with imperative 'Use when...'`);
    }
    if (desc.length > MAX_DESCRIPTION_CHARS) {
        ctx.fail(`Skill '${skill}' description exceeds 1024 chars (${desc.length} chars)`);
    }
    if (!/do not use/i.test(desc)) {
        ctx.warn(`Skill '${skill}' description should specify negative boundaries ('Do not use for...')`);
    }
}
/**
 * Validates one skill directory.
 *
 * @param skill - Skill directory name.
 * @param skillsDir - Parent skills directory.
 * @param ctx - Validation context.
 */
export function checkOneSkill(skill, skillsDir, ctx) {
    const skillFile = path.join(skillsDir, skill, 'SKILL.md');
    if (!fs.existsSync(skillFile)) {
        ctx.fail(`Skill '${skill}' missing SKILL.md`);
        return;
    }
    const content = readTextOrFail(skillFile, `Skill '${skill}'`, ctx.fail);
    if (content === null)
        return;
    const frontMatter = frontMatterBlock(content, skill, ctx.fail);
    if (frontMatter === null)
        return;
    const desc = extractSkillDescription(frontMatter);
    checkDescription(desc, skill, ctx);
    const lines = content.split('\n').length;
    if (lines > MAX_SKILL_LINES) {
        ctx.warn(`Skill '${skill}' exceeds 500 lines (${lines} lines). Offload details to references/.`);
    }
    else {
        ctx.pass(`Skill '${skill}': ${lines} lines, description valid (${desc.length} chars).`);
    }
    if (!/What NOT to do/i.test(content) && !/Gotchas/i.test(content)) {
        ctx.warn(`Skill '${skill}' missing mandatory 'Gotchas & What NOT to Do' section`);
    }
}
/**
 * Validates every skill a workspace chose to install.
 *
 * @param ctx - Validation context.
 * @returns Number of skills validated.
 */
export function phaseSkills(ctx) {
    ctx.log('');
    ctx.heading('3. Checking Installed Skills (.agents/skills)...');
    const skillsDir = path.join(ctx.workspaceRoot, '.agents', 'skills');
    if (!fs.existsSync(skillsDir)) {
        ctx.skip('No .agents/skills directory present; skipping skills validation.');
        return 0;
    }
    const folders = readSkillFolders(skillsDir, ctx.fail);
    for (const skill of folders)
        checkOneSkill(skill, skillsDir, ctx);
    ctx.pass(`Validated ${folders.length} skills in .agents/skills/.`);
    return folders.length;
}
//# sourceMappingURL=skills.js.map