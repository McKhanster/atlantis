"use strict";
/**
 * MCP Server Implementation
 * Forge-compatible MCP server for handling module-to-core communication
 *
 * Uses @modelcontextprotocol/sdk for standard MCP protocol handling
 * Adapts to Forge's resolver pattern for HTTP endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AtlantisMcpServer = exports.McpForgeServer = void 0;
exports.createMcpServer = createMcpServer;
const crypto_1 = require("crypto");
// SDK imports available for future use
// import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// import { z } from 'zod';
const mcp_1 = require("../../types/mcp");
const validation_1 = require("./validation");
const mcp_error_1 = require("../../shared/errors/mcp-error");
const mcp_server_1 = require("./mcp-server");
Object.defineProperty(exports, "AtlantisMcpServer", { enumerable: true, get: function () { return mcp_server_1.AtlantisMcpServer; } });
/**
 * MCP Server for Forge
 * Handles incoming MCP requests and routes them to appropriate handlers
 */
class McpForgeServer {
    serverInfo;
    handlers = new Map();
    registeredModules = new Map();
    constructor(serverInfo) {
        this.serverInfo = serverInfo;
    }
    /**
     * Register a handler for a specific MCP request type
     */
    registerHandler(type, handler) {
        this.handlers.set(type, handler);
        console.log(`[MCP Server] Registered handler for type: ${type}`);
    }
    /**
     * Handle incoming MCP request
     * Main entry point for Forge resolver
     */
    async handleRequest(payload) {
        const startTime = Date.now();
        try {
            // Validate request structure
            const validation = (0, validation_1.validateMCPRequest)(payload);
            if (!validation.success) {
                return this.createErrorResponse('unknown', validation.error.code, validation.error.message, validation.error.details, startTime);
            }
            const request = validation.data;
            console.log(`[MCP Server] Received request: ${request.request.type} (ID: ${request.requestId})`);
            // Check if handler exists
            const handler = this.handlers.get(request.request.type);
            if (!handler) {
                return this.createErrorResponse(request.requestId, mcp_1.MCPErrorCode.NOT_FOUND, `No handler registered for request type: ${request.request.type}`, undefined, startTime);
            }
            // Execute handler
            const result = await handler(request);
            // Create success response
            return this.createSuccessResponse(request.requestId, result, startTime);
        }
        catch (error) {
            console.error('[MCP Server] Error handling request:', error);
            if (error instanceof mcp_error_1.MCPError) {
                return this.createErrorResponse('unknown', error.code, error.message, error.details, startTime);
            }
            return this.createErrorResponse('unknown', mcp_1.MCPErrorCode.INTERNAL_ERROR, error instanceof Error ? error.message : 'Unknown error occurred', undefined, startTime);
        }
    }
    /**
     * Handle module registration requests
     */
    async handleModuleRegistration(payload) {
        try {
            const validation = (0, validation_1.validateModuleRegistration)(payload);
            if (!validation.success) {
                throw new mcp_error_1.MCPError(validation.error.message, validation.error.code, validation.error.details);
            }
            const registration = validation.data;
            console.log(`[MCP Server] Registering module: ${registration.moduleId} (${registration.moduleName})`);
            // Store registration
            this.registeredModules.set(registration.moduleId, registration);
            return {
                registered: true,
                moduleId: registration.moduleId,
                coreEndpoint: this.serverInfo.endpoint,
                // TODO: Generate shared secret for module authentication
                sharedSecret: undefined,
            };
        }
        catch (error) {
            console.error('[MCP Server] Module registration failed:', error);
            throw error;
        }
    }
    /**
     * Get list of registered modules
     */
    getRegisteredModules() {
        return Array.from(this.registeredModules.values());
    }
    /**
     * Get specific registered module
     */
    getModule(moduleId) {
        return this.registeredModules.get(moduleId);
    }
    /**
     * Unregister a module
     */
    unregisterModule(moduleId) {
        const deleted = this.registeredModules.delete(moduleId);
        if (deleted) {
            console.log(`[MCP Server] Unregistered module: ${moduleId}`);
        }
        return deleted;
    }
    /**
     * Create success response
     */
    createSuccessResponse(requestId, result, startTime) {
        return {
            responseId: (0, crypto_1.randomUUID)(),
            requestId,
            mcpVersion: '1.0',
            result,
            metadata: {
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - startTime,
            },
        };
    }
    /**
     * Create error response
     */
    createErrorResponse(requestId, code, message, details, startTime) {
        return {
            responseId: (0, crypto_1.randomUUID)(),
            requestId: requestId === 'unknown' ? (0, crypto_1.randomUUID)() : requestId,
            mcpVersion: '1.0',
            error: {
                code,
                message,
                details,
            },
            metadata: startTime
                ? {
                    timestamp: new Date().toISOString(),
                    processingTime: Date.now() - startTime,
                }
                : undefined,
        };
    }
}
exports.McpForgeServer = McpForgeServer;
/**
 * Create and configure an MCP server instance
 */
function createMcpServer(config) {
    const server = new mcp_server_1.AtlantisMcpServer();
    console.log(`[MCP Server] Created server: ${config.name} v${config.version} at ${config.endpoint}`);
    return server;
}
//# sourceMappingURL=server.js.map