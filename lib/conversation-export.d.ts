export interface ToolCallInfo {
    name: string;
    args?: Record<string, unknown>;
}
export interface TranscriptStep {
    stepIndex: number;
    source: string;
    type: string;
    status?: string;
    createdAt?: string;
    content?: string;
    thinking?: string;
    toolCalls?: ToolCallInfo[];
}
export interface FormatOptions {
    title?: string;
    sessionId?: string;
    includeThinking?: boolean;
}
export interface ExportResult {
    outputPath: string;
    stepCount: number;
}
export declare function parseTranscriptJsonl(jsonlContent: string): TranscriptStep[];
export declare function formatTranscriptToMarkdown(steps: TranscriptStep[], options?: FormatOptions): string;
export declare function exportConversationToFile(transcriptPath: string, outputPath: string, options?: FormatOptions): ExportResult;
declare const _default: {
    parseTranscriptJsonl: typeof parseTranscriptJsonl;
    formatTranscriptToMarkdown: typeof formatTranscriptToMarkdown;
    exportConversationToFile: typeof exportConversationToFile;
};
export default _default;
//# sourceMappingURL=conversation-export.d.ts.map