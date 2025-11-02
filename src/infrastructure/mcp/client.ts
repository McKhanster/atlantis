/**
 * MCP Client Implementation
 * Client for modules to communicate with the Core MCP server
 *
 * Uses Forge's fetch API for HTTP requests
 */

import { randomUUID } from 'crypto';
import {
  type AtlantisRequestType,
  type AtlantisContext,
  type ModuleRegistrationRequest,
  type ModuleRegistrationResponse,
  AtlantisErrorCode,
  CallToolRequest,
  CallToolResult,
} from '../../types/mcp.js';
import { validateCallToolResult } from './validation.js';
import { MCPError } from '../../shared/errors/mcp-error.js';

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
export class McpForgeClient {
  private registered = false;
  private sharedSecret?: string;

  constructor(private config: MCPClientConfig) {}

  /**
   * Register this module with the Core server
   */
  async register(): Promise<void> {
    console.log(
      `[MCP Client] Registering module: ${this.config.moduleInfo.moduleId}`
    );

    try {
      const registrationRequest: ModuleRegistrationRequest =
        this.config.moduleInfo;

      // In a real implementation, this would use @forge/api fetch
      // For now, we'll simulate the registration
      const response = await this.sendHttpRequest<ModuleRegistrationResponse>(
        `${this.config.coreEndpoint}/register`,
        registrationRequest
      );

      if (response.registered) {
        this.registered = true;
        this.sharedSecret = response.sharedSecret;
        console.log(
          `[MCP Client] Module registered successfully: ${response.moduleId}`
        );
      } else {
        throw new MCPError(
          'Module registration failed',
          AtlantisErrorCode.INTERNAL_ERROR
        );
      }
    } catch (error) {
      console.error('[MCP Client] Registration failed:', error);
      throw error;
    }
  }

  /**
   * Send an MCP request to the Core server
   */
  async sendRequest(
    type: AtlantisRequestType,
    context: AtlantisContext,
    params?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    if (!this.registered) {
      throw new MCPError(
        'Module not registered. Call register() first.',
        AtlantisErrorCode.UNAUTHORIZED
      );
    }

    const requestId = randomUUID();
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: type,
        arguments: {
          context,
          params,
          auth: this.sharedSecret,
        },
      },
    };

    console.log(
      `[MCP Client] Sending ${type} request (ID: ${requestId}) to Core`
    );

    try {
      const response = await this.sendMCPRequest(request);

      if (response.error) {
        throw new MCPError(
          'Tool execution failed',
          AtlantisErrorCode.INTERNAL_ERROR
        );
      }

      const textContent = response.content?.[0];
      if (textContent && 'text' in textContent && typeof textContent.text === 'string') {
        return JSON.parse(textContent.text) as Record<string, unknown>;
      }
      return {} as Record<string, unknown>;
    } catch (error) {
      console.error('[MCP Client] Request failed:', error);
      throw error;
    }
  }

  /**
   * Query the Core for AI insights
   */
  async query(
    context: AtlantisContext,
    params?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return this.sendRequest('query', context, params);
  }

  /**
   * Update context in the Core
   */
  async update(
    context: AtlantisContext,
    params?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return this.sendRequest('update', context, params);
  }

  /**
   * Check if module is registered
   */
  isRegistered(): boolean {
    return this.registered;
  }

  /**
   * Send MCP request over HTTP and validate response
   */
  private async sendMCPRequest(request: CallToolRequest): Promise<CallToolResult> {
    try {
      const response = await this.sendHttpRequest<CallToolResult>(
        `${this.config.coreEndpoint}/query`,
        request
      );

      // Validate response structure
      const validation = validateCallToolResult(response);
      if (!validation.success) {
        throw new MCPError(
          validation.error!.message,
          validation.error!.code,
          validation.error!.details
        );
      }

      return response;
    } catch (error) {
      if (error instanceof MCPError) {
        throw error;
      }

      throw new MCPError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        AtlantisErrorCode.INTERNAL_ERROR
      );
    }
  }

  /**
   * Generic HTTP request helper
   * In production, this would use @forge/api fetch with proper authentication
   */
  private async sendHttpRequest<T>(
    _url: string,
    _body: unknown
  ): Promise<T> {
    // Note: In real Forge implementation, use:
    // import { fetch } from '@forge/api';
    // const response = await fetch(url, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(body),
    // });

    // For now, simulate the response
    // This will be replaced with actual Forge fetch in integration
    throw new Error(
      'HTTP requests not implemented in test environment. Use real Forge fetch in production.'
    );
  }
}

/**
 * Create an MCP client instance
 */
export function createMcpClient(config: MCPClientConfig): McpForgeClient {
  const client = new McpForgeClient(config);
  console.log(
    `[MCP Client] Created client for module: ${config.moduleInfo.moduleId}`
  );
  return client;
}
