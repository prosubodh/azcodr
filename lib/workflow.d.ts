export interface InstallWorkflowOptions {
    dryRun?: boolean;
    force?: boolean;
}
export interface InstallWorkflowResult {
    installed: boolean;
    action?: string;
    reason?: string;
    filePath?: string;
}
export interface WorkflowDescriptor {
    filename: string;
    templateFile: string;
    description: string;
}
export declare const WORKFLOW_DESCRIPTORS: Record<string, WorkflowDescriptor>;
export declare function installWorkflowTemplate(targetDir: string, workflowKey: 'ci' | 'publish' | string, options?: InstallWorkflowOptions): InstallWorkflowResult;
declare const _default: {
    WORKFLOW_DESCRIPTORS: Record<string, WorkflowDescriptor>;
    installWorkflowTemplate: typeof installWorkflowTemplate;
};
export default _default;
//# sourceMappingURL=workflow.d.ts.map