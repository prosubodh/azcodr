/**
 * Configuration options for symlink and pointer creation.
 */
export interface EnsureSymlinkOptions {
    targetDir: string;
    linkName: string;
    targetFileName: string;
    dryRun?: boolean;
}
/**
 * Detects whether linkName and targetFileName refer to the same entry on a case-insensitive filesystem.
 * Uses exact directory listing (not existsSync, which lies on case-insensitive systems).
 *
 * @param targetDir - Directory containing the file entries.
 * @param linkName - Name of the proposed symlink or alias entry.
 * @param targetFileName - Target file name to match against.
 * @returns True if both names resolve to the same disk file on a case-insensitive filesystem.
 */
export declare function isSameCaseInsensitiveFile(targetDir: string, linkName: string, targetFileName: string): boolean;
/**
 * Safely creates or updates a symbolic link, falling back to a file copy if symlinks are unsupported.
 *
 * @param options - Options specifying target directory, link name, target file name, and dry-run mode.
 * @returns True if the symlink or copy fallback was successfully established.
 */
export declare function ensureSymlink(options: EnsureSymlinkOptions): boolean;
/**
 * Creates a symlink, falling back to a text pointer (not a full copy).
 * Used for .github/copilot-instructions.md where a full AGENTS.md copy would
 * break relative markdown links (they resolve from .github/, not root).
 *
 * @param options - Options specifying target directory, link name, target file name, and dry-run mode.
 * @returns True if the symlink or pointer fallback was successfully established.
 */
export declare function ensureSymlinkOrPointer(options: EnsureSymlinkOptions): boolean;
declare const _default: {
    isSameCaseInsensitiveFile: typeof isSameCaseInsensitiveFile;
    ensureSymlink: typeof ensureSymlink;
    ensureSymlinkOrPointer: typeof ensureSymlinkOrPointer;
};
export default _default;
//# sourceMappingURL=links.d.ts.map