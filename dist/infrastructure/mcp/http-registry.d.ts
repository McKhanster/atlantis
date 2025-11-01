/**
 * HTTP API Sync Module Registry - Distributed state across MCP server instances
 */
import { ModuleInfo } from './mcp-server';
export declare class HttpModuleRegistry {
    getModules(): Promise<ModuleInfo[]>;
    addModule(module: ModuleInfo): Promise<void>;
    removeModule(moduleId: string): Promise<boolean>;
}
//# sourceMappingURL=http-registry.d.ts.map