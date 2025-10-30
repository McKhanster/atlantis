/**
 * MCP Server Implementation
 * Forge-compatible MCP server for handling module-to-core communication
 *
 * Uses @modelcontextprotocol/sdk for standard MCP protocol handling
 * Adapts to Forge's resolver pattern for HTTP endpoints
 */

import { randomUUID } from 'crypto';
import {
  type MCPRequest,
  type MCPResponse,
  type MCPRequestType,
  MCPErrorCode,
  type ModuleRegistrationRequest,
  type ModuleRegistrationResponse,
} from '../../types/mcp';
import {
  validateMCPRequest,
  validateModuleRegistration,
} from './validation';
import { MCPError } from '../../shared/errors/mcp-error';

/**
 * Handler function type for MCP requests
 */
export type MCPRequestHandler = (
  request: MCPRequest
) => Promise<Record<string, unknown>>;

/**
 * MCP Server for Forge
 * Handles incoming MCP requests and routes them to appropriate handlers
 */
export class McpForgeServer {
  private handlers: Map<MCPRequestType, MCPRequestHandler> = new Map();
  private registeredModules: Map<string, ModuleRegistrationRequest> = new Map();

  constructor(
    private serverInfo: {
      name: string;
      version: string;
      endpoint: string;
    }
  ) {}

  /**
   * Register a handler for a specific MCP request type
   */
  registerHandler(type: MCPRequestType, handler: MCPRequestHandler): void {
    this.handlers.set(type, handler);
    console.log(`[MCP Server] Registered handler for type: ${type}`);
  }

  /**
   * Handle incoming MCP request
   * Main entry point for Forge resolver
   */
  async handleRequest(payload: unknown): Promise<MCPResponse> {
    const startTime = Date.now();

    try {
      // Validate request structure
      const validation = validateMCPRequest(payload);
      if (!validation.success) {
        return this.createErrorResponse(
          'unknown',
          validation.error!.code,
          validation.error!.message,
          validation.error!.details,
          startTime
        );
      }

      const request = validation.data!;
      console.log(
        `[MCP Server] Received request: ${request.request.type} (ID: ${request.requestId})`
      );

      // Check if handler exists
      const handler = this.handlers.get(request.request.type);
      if (!handler) {
        return this.createErrorResponse(
          request.requestId,
          MCPErrorCode.NOT_FOUND,
          `No handler registered for request type: ${request.request.type}`,
          undefined,
          startTime
        );
      }

      // Execute handler
      const result = await handler(request);

      // Create success response
      return this.createSuccessResponse(request.requestId, result, startTime);
    } catch (error) {
      console.error('[MCP Server] Error handling request:', error);

      if (error instanceof MCPError) {
        return this.createErrorResponse(
          'unknown',
          error.code,
          error.message,
          error.details,
          startTime
        );
      }

      return this.createErrorResponse(
        'unknown',
        MCPErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Unknown error occurred',
        undefined,
        startTime
      );
    }
  }

  /**
   * Handle module registration requests
   */
  async handleModuleRegistration(
    payload: unknown
  ): Promise<ModuleRegistrationResponse> {
    try {
      const validation = validateModuleRegistration(payload);
      if (!validation.success) {
        throw new MCPError(
          validation.error!.message,
          validation.error!.code,
          validation.error!.details
        );
      }

      const registration = validation.data!;
      console.log(
        `[MCP Server] Registering module: ${registration.moduleId} (${registration.moduleName})`
      );

      // Store registration
      this.registeredModules.set(registration.moduleId, registration);

      return {
        registered: true,
        moduleId: registration.moduleId,
        coreEndpoint: this.serverInfo.endpoint,
        // TODO: Generate shared secret for module authentication
        sharedSecret: undefined,
      };
    } catch (error) {
      console.error('[MCP Server] Module registration failed:', error);
      throw error;
    }
  }

  /**
   * Get list of registered modules
   */
  getRegisteredModules(): ModuleRegistrationRequest[] {
    return Array.from(this.registeredModules.values());
  }

  /**
   * Get specific registered module
   */
  getModule(moduleId: string): ModuleRegistrationRequest | undefined {
    return this.registeredModules.get(moduleId);
  }

  /**
   * Unregister a module
   */
  unregisterModule(moduleId: string): boolean {
    const deleted = this.registeredModules.delete(moduleId);
    if (deleted) {
      console.log(`[MCP Server] Unregistered module: ${moduleId}`);
    }
    return deleted;
  }

  /**
   * Create success response
   */
  private createSuccessResponse(
    requestId: string,
    result: Record<string, unknown>,
    startTime: number
  ): MCPResponse {
    return {
      responseId: randomUUID(),
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
  private createErrorResponse(
    requestId: string,
    code: MCPErrorCode,
    message: string,
    details?: Record<string, unknown>,
    startTime?: number
  ): MCPResponse {
    return {
      responseId: randomUUID(),
      requestId: requestId === 'unknown' ? randomUUID() : requestId,
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

/**
 * Create and configure an MCP server instance
 */
export function createMcpServer(config: {
  name: string;
  version: string;
  endpoint: string;
}): McpForgeServer {
  const server = new McpForgeServer(config);
  console.log(
    `[MCP Server] Created server: ${config.name} v${config.version} at ${config.endpoint}`
  );
  return server;
}
