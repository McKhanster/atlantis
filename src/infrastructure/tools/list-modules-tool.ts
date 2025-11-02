/**
 * List Modules Tool - Inherits from BaseTool
 */

import { BaseTool } from './base-tool.js';
import { HttpModuleRegistry } from '../mcp/http-registry.js';
import { ModuleInfo } from '../mcp/mcp-server.js';
import { CallToolResult } from '../../types/mcp.js';

export class ListModulesTool extends BaseTool {
  private static instance: ListModulesTool;
  private registry: HttpModuleRegistry;

  private constructor() {
    super('list_modules');
    this.registry = new HttpModuleRegistry();
  }

  static getInstance(): ListModulesTool {
    if (!ListModulesTool.instance) {
      ListModulesTool.instance = new ListModulesTool();
    }
    return ListModulesTool.instance;
  }

  async execute(requestId: string = 'list-modules', data: Record<string, unknown>): Promise<CallToolResult> {
    const startTime = Date.now();
    this.incrementCallCount();
    
    const modules = await this.registry.getModules();
    const result = {
      modules,
      count: modules.length,
      timestamp: new Date().toISOString()
    };
    
    return this.createMCPResponse(requestId, result, data, startTime);
  }
}