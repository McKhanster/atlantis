/**
 * List Modules Tool - Inherits from BaseTool
 */

import { BaseTool } from './base-tool';
import { HttpModuleRegistry } from '../mcp/http-registry';
import { ModuleInfo } from '../mcp/mcp-server';
import { MCPResponse } from '../../types/mcp';

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

  async execute(requestId: string = 'list-modules'): Promise<MCPResponse> {
    const startTime = Date.now();
    this.incrementCallCount();
    
    const modules = await this.registry.getModules();
    const result = {
      modules,
      count: modules.length,
      timestamp: new Date().toISOString()
    };
    
    return this.createMCPResponse(requestId, result, startTime);
  }
}