export declare const SUPPORTED_LANGUAGES: readonly ["typescript", "javascript", "deno", "bun", "python", "rust", "go", "java", "csharp", "cpp", "c", "generic"];
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export declare const TOPOLOGY_ALIASES: Record<string, string>;
export interface BootstrapOptions {
    topology?: string;
    language?: string;
    allowProtected?: boolean;
    dryRun?: boolean;
    resetMemory?: boolean;
    out?: (msg: string) => void;
    err?: (msg: string) => void;
}
export interface BootstrapResult {
    success: boolean;
    topology: string;
    language: string;
    actions: string[];
    error?: string;
}
export declare function bootstrapWorkspace(targetDir: string, options?: BootstrapOptions): BootstrapResult;
declare const _default: {
    SUPPORTED_LANGUAGES: readonly ["typescript", "javascript", "deno", "bun", "python", "rust", "go", "java", "csharp", "cpp", "c", "generic"];
    TOPOLOGY_ALIASES: Record<string, string>;
    bootstrapWorkspace: typeof bootstrapWorkspace;
};
export default _default;
//# sourceMappingURL=topology.d.ts.map