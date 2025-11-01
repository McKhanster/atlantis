/**
 * Shared Module Registry - File-based persistence across MCP server instances
 */
import { ModuleInfo } from './mcp-server';
export declare class SharedModuleRegistry {
    getModules(): Promise<ModuleInfo[]>;
    addModule(module: ModuleInfo): Promise<void>;
    removeModule(moduleId: string): Promise<boolean>;
}
//# sourceMappingURL=shared-registry.d.ts.map