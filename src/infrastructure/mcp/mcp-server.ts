/**
 * Real MCP Server Implementation using @modelcontextprotocol/sdk
 * Replaces the fake MCP implementation with proper SDK integration
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { HttpModuleRegistry } from './http-registry';

import { CentralLogger } from './central-logger';
import { BaseTool } from '../tools/base-tool';
import { HealthCheckTool } from '../tools/health-check-tool';
import { ListModulesTool } from '../tools/list-modules-tool';

export interface ModuleInfo {
  moduleId: string;
  moduleName: string;
  capabilities: string[];
}

/**
 * Atlantis Core MCP Server
 * Provides tools for module registration and health monitoring
 */
export class AtlantisMcpServer {
  private server: McpServer;
  private registry: HttpModuleRegistry;

  constructor() {
    this.server = new McpServer(
      {
        name: 'atlantis-core',
        version: '1.0.0',
        description: 'AI-Native Orchestrator Core - MCP Server'
      },
      {
        capabilities: {
          logging: {},
          tools: {}
        }
      }
    );
    
    this.registry = new HttpModuleRegistry();
    this.registerTools();
  }

  private registerTools(): void {
    // Health check tool
    this.server.registerTool('health_check', {
      title: 'Health Check',
      description: 'Check the health status of Atlantis Core',
      inputSchema: {},
      outputSchema: {
        status: z.string(),
        timestamp: z.string(),
        server: z.string(),
        version: z.string()
      }
    }, async (data) => {

      const tool = HealthCheckTool.getInstance();
      const mcpResponse = await tool.execute('health-check-' + Date.now());

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(mcpResponse.result, null, 2)
        }],
        structuredContent: mcpResponse.result
      };
    });

    // List modules tool
    this.server.registerTool('list_modules', {
      title: 'List Modules',
      description: 'List all registered modules in Atlantis Core',
      inputSchema: {},
      outputSchema: {
        modules: z.array(z.object({
          moduleId: z.string(),
          moduleName: z.string(),
          capabilities: z.array(z.string())
        })),
        count: z.number(),
        timestamp: z.string()
      }
    }, async () => {
      // MCP logging for connected client
      this.server.sendLoggingMessage({
        level: 'info',
        logger: 'atlantis-core',
        data: { 
          interaction: 'LIST_MODULES_REQUEST',
          source: 'rovo-dev',
          timestamp: new Date().toISOString()
        }
      });

      console.error('📋 [LIST_MODULES] Rovo Dev requested module list');
      const tool = ListModulesTool.getInstance();
      const mcpResponse = await tool.execute('list-modules-' + Date.now());
      console.error(`📦 [LIST_MODULES] Using MCP response format`);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(mcpResponse.result, null, 2)
        }],
        structuredContent: mcpResponse.result
      };
    });

    // Register module tool
    this.server.registerTool('register_module', {
      title: 'Register Module',
      description: 'Register a new module with Atlantis Core',
      inputSchema: {
        moduleId: z.string(),
        moduleName: z.string(),
        capabilities: z.array(z.string()).optional()
      },
      outputSchema: {
        registered: z.boolean(),
        moduleId: z.string(),
        moduleName: z.string(),
        capabilities: z.array(z.string()),
        timestamp: z.string()
      }
    }, async ({ moduleId, moduleName, capabilities }) => {
      // MCP logging for connected client
      this.server.sendLoggingMessage({
        level: 'info',
        logger: 'atlantis-core',
        data: { 
          interaction: 'REGISTER_MODULE_REQUEST',
          source: 'rovo-dev',
          moduleId,
          moduleName,
          capabilities,
          timestamp: new Date().toISOString()
        }
      });

      console.error(`📡 [REGISTER_MODULE] Rovo Dev registering: ${moduleId} (${moduleName})`);
      const moduleInfo: ModuleInfo = {
        moduleId,
        moduleName,
        capabilities: capabilities || []
      };
      
      await this.registry.addModule(moduleInfo);
      
      const output = {
        registered: true,
        moduleId,
        moduleName,
        capabilities: moduleInfo.capabilities,
        timestamp: new Date().toISOString()
      };
      
      console.error(`✅ [REGISTER_MODULE] Successfully registered ${moduleId}`);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(output, null, 2)
        }],
        structuredContent: output
      };
    });

    // Singleton tool
    this.server.registerTool('singleton_status', {
      title: 'Singleton Status',
      description: 'Get status from singleton tool instance',
      inputSchema: {},
      outputSchema: {
        toolName: z.string(),
        createdAt: z.string(),
        callCount: z.number(),
        timestamp: z.string()
      }
    }, async () => {
      const healthTool = HealthCheckTool.getInstance();
      const status = healthTool.getBaseStatus();
      const output = {
        ...status,
        timestamp: new Date().toISOString()
      };
      
      console.error(`🔄 [BASE_TOOL] ${status.toolName} call count: ${status.callCount}`);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(output, null, 2)
        }],
        structuredContent: output
      };
    });
  }

  /**
   * Start the MCP server with stdio transport
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🚀 Atlantis Core MCP Server running on stdio');
    console.error('📡 Logging all interactions...');
    
    // Keep the process alive
    return new Promise(() => {
      // This promise never resolves, keeping the server running
    });
  }

  /**
   * Get the underlying MCP server instance
   */
  getServer(): McpServer {
    return this.server;
  }

  /**
   * Get registered modules
   */
  async getModules(): Promise<ModuleInfo[]> {
    return await this.registry.getModules();
  }
}