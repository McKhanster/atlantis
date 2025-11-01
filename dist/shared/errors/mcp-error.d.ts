/**
 * MCP-specific error classes
 */
import { MCPErrorCode } from '../../types/mcp';
export declare class MCPError extends Error {
    readonly code: MCPErrorCode;
    readonly details?: Record<string, unknown> | undefined;
    constructor(message: string, code: MCPErrorCode, details?: Record<string, unknown> | undefined);
}
//# sourceMappingURL=mcp-error.d.ts.map