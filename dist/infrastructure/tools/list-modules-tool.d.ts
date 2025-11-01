/**
 * List Modules Tool - Inherits from BaseTool
 */
import { BaseTool } from './base-tool';
import { MCPResponse } from '../../types/mcp';
export declare class ListModulesTool extends BaseTool {
    private static instance;
    private registry;
    private constructor();
    static getInstance(): ListModulesTool;
    execute(requestId?: string): Promise<MCPResponse>;
}
//# sourceMappingURL=list-modules-tool.d.ts.map