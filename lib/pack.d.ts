import type { Methodology } from './harness-config.js';
export interface PackCheckDefinition {
    id: string;
    enabled?: boolean;
    severity?: 'error' | 'warn';
    params?: Record<string, unknown>;
}
export interface CapabilityPack {
    name: string;
    description: string;
    methodology?: Methodology;
    checks?: PackCheckDefinition[];
}
export interface InstallPackOptions {
    dryRun?: boolean;
}
export interface InstallPackResult {
    packName: string;
    configPath: string;
    alreadyInstalled: boolean;
    actions: string[];
}
export declare const KNOWN_PACK_NAMES: readonly string[];
export declare function getPackDefinition(rawName: string): CapabilityPack;
export declare function installPack(targetDir: string, packName: string, options?: InstallPackOptions): InstallPackResult;
//# sourceMappingURL=pack.d.ts.map