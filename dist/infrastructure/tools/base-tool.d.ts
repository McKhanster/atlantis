/**
 * Base Tool - Base class that all core tools must inherit from
 */
import { CentralLogger } from '../mcp/central-logger';
import { MCPResponse } from '../../types/mcp';
export declare abstract class BaseTool {
    protected createdAt: string;
    protected callCount: number;
    protected toolName: string;
    protected logger: CentralLogger;
    constructor(toolName: string);
    protected logInteraction(type: string, data: Record<string, unknown>): void;
    protected incrementCallCount(): void;
    protected createMCPResponse(requestId: string, result: Record<string, unknown>, processingStartTime: number): MCPResponse;
    getBaseStatus(): {
        toolName: string;
        createdAt: string;
        callCount: number;
    };
}
//# sourceMappingURL=base-tool.d.ts.map