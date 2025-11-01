/**
 * Real MCP Server Implementation using @modelcontextprotocol/sdk
 * Replaces the fake MCP implementation with proper SDK integration
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
export interface ModuleInfo {
    moduleId: string;
    moduleName: string;
    capabilities: string[];
}
/**
 * Atlantis Core MCP Server
 * Provides tools for module registration and health monitoring
 */
export declare class AtlantisMcpServer {
    private server;
    private registry;
    constructor();
    private registerTools;
    /**
     * Start the MCP server with stdio transport
     */
    start(): Promise<void>;
    /**
     * Get the underlying MCP server instance
     */
    getServer(): McpServer;
    /**
     * Get registered modules
     */
    getModules(): Promise<ModuleInfo[]>;
}
//# sourceMappingURL=mcp-server.d.ts.map