/**
 * Text helpers shared by the validator phases.
 *
 * Both exist because generated documentation routinely contains ADR headings,
 * rule headers and mandate lines inside examples. Matching the raw file would
 * mistake documentation ABOUT the contract for the contract itself.
 */
/**
 * Removes HTML comments, tolerating unclosed ones.
 *
 * A stray `<!--` from an editor's "comment selection" must not silently hide
 * every heading after it.
 *
 * @param text - Raw file contents.
 * @returns Contents with comments removed.
 */
export declare function stripHtmlComments(text: string): string;
/**
 * Removes fenced code blocks so examples inside documentation are not mistaken
 * for real content.
 *
 * Without this, a rule file whose only heading sits inside a ```md fence
 * satisfies the structural check, and an `ADR-001` shown as an example is
 * counted as a real decision.
 *
 * @param text - Raw file contents.
 * @returns Contents with fenced blocks removed.
 */
export declare function stripFencedCode(text: string): string;
//# sourceMappingURL=text.d.ts.map