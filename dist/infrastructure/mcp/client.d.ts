/**
 * MCP Client Implementation
 * Client for modules to communicate with the Core MCP server
 *
 * Uses Forge's fetch API for HTTP requests
 */
import { type MCPRequestType, type MCPContext } from '../../types/mcp';
export interface MCPClientConfig {
    coreEndpoint: string;
    moduleInfo: {
        moduleId: string;
        moduleName: string;
        moduleType: string;
        capabilities: string[];
        mcpEndpoint: string;
        metadata: {
            version: string;
            description?: string;
        };
    };
    timeout?: number;
}
/**
 * MCP Client for Forge modules
 * Handles outgoing MCP requests to the Core server
 */
export declare class McpForgeClient {
    private config;
    private registered;
    private sharedSecret?;
    constructor(config: MCPClientConfig);
    /**
     * Register this module with the Core server
     */
    register(): Promise<void>;
    /**
     * Send an MCP request to the Core server
     */
    sendRequest(type: MCPRequestType, context: MCPContext, params?: Record<string, unknown>): Promise<Record<string, unknown>>;
    /**
     * Query the Core for AI insights
     */
    query(context: MCPContext, params?: Record<string, unknown>): Promise<Record<string, unknown>>;
    /**
     * Update context in the Core
     */
    update(context: MCPContext, params?: Record<string, unknown>): Promise<Record<string, unknown>>;
    /**
     * Check if module is registered
     */
    isRegistered(): boolean;
    /**
     * Send MCP request over HTTP and validate response
     */
    private sendMCPRequest;
    /**
     * Generic HTTP request helper
     * In production, this would use @forge/api fetch with proper authentication
     */
    private sendHttpRequest;
}
/**
 * Create an MCP client instance
 */
export declare function createMcpClient(config: MCPClientConfig): McpForgeClient;
//# sourceMappingURL=client.d.ts.map