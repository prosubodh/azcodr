export interface AskQuestionOptions {
    input?: NodeJS.ReadableStream;
    output?: NodeJS.WritableStream;
}
export declare function askQuestion(query: string, { input, output }?: AskQuestionOptions): Promise<string>;
export interface PromptIo {
    stdin: NodeJS.ReadStream | (NodeJS.ReadableStream & {
        isTTY?: boolean;
    });
    stdout: NodeJS.WriteStream | NodeJS.WritableStream;
}
export declare function promptForTargetDir(io: PromptIo): Promise<string>;
export declare function rejectBadTarget(resolvedTarget: string, templateDir: string): string | null;
export interface ResolveTargetIo extends PromptIo {
    cwd: string;
    templateDir: string;
}
export interface ResolveTargetResult {
    resolvedTarget: string;
    chosen: string;
    error: string | null;
}
export declare function resolveTargetDir(targetDir: string | null, io: ResolveTargetIo): Promise<ResolveTargetResult>;
export type TargetDirectoryStatus = 'missing' | 'not-a-directory' | 'empty' | 'non-empty';
export interface TargetStatusResult {
    status: TargetDirectoryStatus;
    count: number;
}
export declare function targetStatus(resolvedTarget: string): TargetStatusResult;
export interface ConfirmOverwriteIo extends PromptIo {
    out: (msg: string) => void;
}
export interface ConfirmOverwriteResult {
    confirmed: boolean;
    aborted: boolean;
}
export declare function confirmOverwrite(targetDir: string, count: number, io: ConfirmOverwriteIo): Promise<ConfirmOverwriteResult>;
export interface EnsureWritableOptions {
    chosen: string;
    resolvedTarget: string;
    force: boolean;
    io: ConfirmOverwriteIo & {
        err: (msg: string) => void;
    };
}
export interface EnsureWritableResult {
    force?: boolean;
    exitCode?: number;
    message?: string | null;
}
/**
 * Ensures the target may be written. Returns { force } on success or
 * { exitCode, message? } when the CLI must stop before scaffolding.
 */
export declare function ensureWritableTarget(options: EnsureWritableOptions): Promise<EnsureWritableResult>;
declare const _default: {
    askQuestion: typeof askQuestion;
    promptForTargetDir: typeof promptForTargetDir;
    rejectBadTarget: typeof rejectBadTarget;
    resolveTargetDir: typeof resolveTargetDir;
    targetStatus: typeof targetStatus;
    confirmOverwrite: typeof confirmOverwrite;
    ensureWritableTarget: typeof ensureWritableTarget;
};
export default _default;
//# sourceMappingURL=cli-target.d.ts.map