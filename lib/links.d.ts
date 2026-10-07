export interface EnsureSymlinkOptions {
    targetDir: string;
    linkName: string;
    targetFileName: string;
    dryRun?: boolean;
}
/**
 * Detects whether linkName and targetFileName refer to the same entry on a case-insensitive filesystem.
 * Uses exact directory listing (not existsSync, which lies on case-insensitive systems).
 */
export declare function isSameCaseInsensitiveFile(targetDir: string, linkName: string, targetFileName: string): boolean;
/**
 * Safely creates or updates a symbolic link, falling back to a file copy if symlinks are unsupported.
 */
export declare function ensureSymlink(options: EnsureSymlinkOptions): boolean;
/**
 * Creates a symlink, falling back to a text pointer (not a full copy).
 * Used for .github/copilot-instructions.md where a full AGENTS.md copy would
 * break relative markdown links (they resolve from .github/, not root).
 */
export declare function ensureSymlinkOrPointer(options: EnsureSymlinkOptions): boolean;
declare const _default: {
    isSameCaseInsensitiveFile: typeof isSameCaseInsensitiveFile;
    ensureSymlink: typeof ensureSymlink;
    ensureSymlinkOrPointer: typeof ensureSymlinkOrPointer;
};
export default _default;
//# sourceMappingURL=links.d.ts.map