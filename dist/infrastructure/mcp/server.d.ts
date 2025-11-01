/**
 * MCP Server Implementation
 * Forge-compatible MCP server for handling module-to-core communication
 *
 * Uses @modelcontextprotocol/sdk for standard MCP protocol handling
 * Adapts to Forge's resolver pattern for HTTP endpoints
 */
import { type MCPRequest, type MCPResponse, type MCPRequestType, type ModuleRegistrationRequest, type ModuleRegistrationResponse } from '../../types/mcp';
import { AtlantisMcpServer } from './mcp-server';
/**
 * Handler function type for MCP requests
 */
export type MCPRequestHandler = (request: MCPRequest) => Promise<Record<string, unknown>>;
/**
 * MCP Server for Forge
 * Handles incoming MCP requests and routes them to appropriate handlers
 */
declare class McpForgeServer {
    private serverInfo;
    private handlers;
    private registeredModules;
    constructor(serverInfo: {
        name: string;
        version: string;
        endpoint: string;
    });
    /**
     * Register a handler for a specific MCP request type
     */
    registerHandler(type: MCPRequestType, handler: MCPRequestHandler): void;
    /**
     * Handle incoming MCP request
     * Main entry point for Forge resolver
     */
    handleRequest(payload: unknown): Promise<MCPResponse>;
    /**
     * Handle module registration requests
     */
    handleModuleRegistration(payload: unknown): Promise<ModuleRegistrationResponse>;
    /**
     * Get list of registered modules
     */
    getRegisteredModules(): ModuleRegistrationRequest[];
    /**
     * Get specific registered module
     */
    getModule(moduleId: string): ModuleRegistrationRequest | undefined;
    /**
     * Unregister a module
     */
    unregisterModule(moduleId: string): boolean;
    /**
     * Create success response
     */
    private createSuccessResponse;
    /**
     * Create error response
     */
    private createErrorResponse;
}
/**
 * Create and configure an MCP server instance
 */
export declare function createMcpServer(config: {
    name: string;
    version: string;
    endpoint: string;
}): AtlantisMcpServer;
export { McpForgeServer, AtlantisMcpServer };
//# sourceMappingURL=server.d.ts.map