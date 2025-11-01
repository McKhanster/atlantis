"use strict";
/**
 * MCP Client Implementation
 * Client for modules to communicate with the Core MCP server
 *
 * Uses Forge's fetch API for HTTP requests
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpForgeClient = void 0;
exports.createMcpClient = createMcpClient;
const crypto_1 = require("crypto");
const mcp_1 = require("../../types/mcp");
const validation_1 = require("./validation");
const mcp_error_1 = require("../../shared/errors/mcp-error");
/**
 * MCP Client for Forge modules
 * Handles outgoing MCP requests to the Core server
 */
class McpForgeClient {
    config;
    registered = false;
    sharedSecret;
    constructor(config) {
        this.config = config;
    }
    /**
     * Register this module with the Core server
     */
    async register() {
        console.log(`[MCP Client] Registering module: ${this.config.moduleInfo.moduleId}`);
        try {
            const registrationRequest = this.config.moduleInfo;
            // In a real implementation, this would use @forge/api fetch
            // For now, we'll simulate the registration
            const response = await this.sendHttpRequest(`${this.config.coreEndpoint}/register`, registrationRequest);
            if (response.registered) {
                this.registered = true;
                this.sharedSecret = response.sharedSecret;
                console.log(`[MCP Client] Module registered successfully: ${response.moduleId}`);
            }
            else {
                throw new mcp_error_1.MCPError('Module registration failed', mcp_1.MCPErrorCode.INTERNAL_ERROR);
            }
        }
        catch (error) {
            console.error('[MCP Client] Registration failed:', error);
            throw error;
        }
    }
    /**
     * Send an MCP request to the Core server
     */
    async sendRequest(type, context, params) {
        if (!this.registered) {
            throw new mcp_error_1.MCPError('Module not registered. Call register() first.', mcp_1.MCPErrorCode.UNAUTHORIZED);
        }
        const requestId = (0, crypto_1.randomUUID)();
        const request = {
            mcpVersion: '1.0',
            requestId,
            contextId: `${this.config.moduleInfo.moduleId}-${Date.now()}`,
            context,
            request: {
                type,
                params,
            },
            auth: this.sharedSecret
                ? {
                    token: this.sharedSecret,
                }
                : undefined,
        };
        console.log(`[MCP Client] Sending ${type} request (ID: ${requestId}) to Core`);
        try {
            const response = await this.sendMCPRequest(request);
            if (response.error) {
                throw new mcp_error_1.MCPError(response.error.message, response.error.code, response.error.details);
            }
            return response.result || {};
        }
        catch (error) {
            console.error('[MCP Client] Request failed:', error);
            throw error;
        }
    }
    /**
     * Query the Core for AI insights
     */
    async query(context, params) {
        return this.sendRequest('query', context, params);
    }
    /**
     * Update context in the Core
     */
    async update(context, params) {
        return this.sendRequest('update', context, params);
    }
    /**
     * Check if module is registered
     */
    isRegistered() {
        return this.registered;
    }
    /**
     * Send MCP request over HTTP and validate response
     */
    async sendMCPRequest(request) {
        try {
            const response = await this.sendHttpRequest(`${this.config.coreEndpoint}/query`, request);
            // Validate response structure
            const validation = (0, validation_1.validateMCPResponse)(response);
            if (!validation.success) {
                throw new mcp_error_1.MCPError(validation.error.message, validation.error.code, validation.error.details);
            }
            return response;
        }
        catch (error) {
            if (error instanceof mcp_error_1.MCPError) {
                throw error;
            }
            throw new mcp_error_1.MCPError(error instanceof Error ? error.message : 'Unknown error occurred', mcp_1.MCPErrorCode.INTERNAL_ERROR);
        }
    }
    /**
     * Generic HTTP request helper
     * In production, this would use @forge/api fetch with proper authentication
     */
    async sendHttpRequest(_url, _body) {
        // Note: In real Forge implementation, use:
        // import { fetch } from '@forge/api';
        // const response = await fetch(url, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(body),
        // });
        // For now, simulate the response
        // This will be replaced with actual Forge fetch in integration
        throw new Error('HTTP requests not implemented in test environment. Use real Forge fetch in production.');
    }
}
exports.McpForgeClient = McpForgeClient;
/**
 * Create an MCP client instance
 */
function createMcpClient(config) {
    const client = new McpForgeClient(config);
    console.log(`[MCP Client] Created client for module: ${config.moduleInfo.moduleId}`);
    return client;
}
//# sourceMappingURL=client.js.map