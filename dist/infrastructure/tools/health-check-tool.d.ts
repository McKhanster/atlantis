/**
 * Health Check Tool - Inherits from BaseTool
 */
import { BaseTool } from './base-tool';
import { MCPResponse } from '../../types/mcp';
export declare class HealthCheckTool extends BaseTool {
    private static instance;
    private constructor();
    static getInstance(): HealthCheckTool;
    execute(requestId?: string): Promise<MCPResponse>;
}
//# sourceMappingURL=health-check-tool.d.ts.map