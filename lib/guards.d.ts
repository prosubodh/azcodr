export interface ProtectedTargetOptions {
    templateDir?: string;
    force?: boolean;
    dryRun?: boolean;
    allowProtected?: boolean;
}
/**
 * Filesystem scope guard (Supply Chain: filesystem access).
 * Constrains all reads/writes to targetDir / templateDir.
 */
export declare function assertInside(root: string, candidate: string, message?: string): void;
/**
 * Normalizes a path for protected-target comparison. On Windows the filesystem
 * is case-insensitive, so `C:\Users\Name` and `c:\users\name` are the same
 * directory and must compare equal.
 */
export declare function normalizeForComparison(p: string): string;
/**
 * Returns true when `targetDir` is a location the scaffolder must never write
 * into: the filesystem root, the user's home directory, the home directory's
 * parent (e.g. /home, C:\Users -- scaffolding there affects every user), or an
 * ancestor of the template itself (scaffolding into D:\projects would merge
 * the template into its own parent).
 *
 * Lexical comparison is not enough: a symlink pointing at home must also be
 * caught, so an existing target is resolved with realpath before comparing.
 */
export declare function isProtectedTarget(targetDir: string, options?: ProtectedTargetOptions): boolean;
declare const _default: {
    assertInside: typeof assertInside;
    normalizeForComparison: typeof normalizeForComparison;
    isProtectedTarget: typeof isProtectedTarget;
};
export default _default;
//# sourceMappingURL=guards.d.ts.map