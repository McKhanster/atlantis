/**
 * Health Check Tool - Inherits from BaseTool
 */

import { BaseTool } from './base-tool.js';
import { MCPResponse } from '../../types/mcp.js';

export class HealthCheckTool extends BaseTool {
  private static instance: HealthCheckTool;

  private constructor() {
    super('health_check');
  }

  static getInstance(): HealthCheckTool {
    if (!HealthCheckTool.instance) {
      HealthCheckTool.instance = new HealthCheckTool();
    }
    return HealthCheckTool.instance;
  }

  async execute(requestId: string = 'health-check', data: Record<string, unknown>, req: Record<string, unknown>): Promise<MCPResponse> {
    const startTime = Date.now();
    this.incrementCallCount();
    
    const result = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      server: 'atlantis-core',
      version: '1.0.0'
    };
    
    return this.createMCPResponse(requestId, result, req, startTime);
  }
}