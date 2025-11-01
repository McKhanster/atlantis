/**
 * Base Tool - Base class that all core tools must inherit from
 */

import { randomUUID } from 'crypto';
import { CentralLogger } from '../mcp/central-logger';
import { MCPRequest, MCPResponse } from '../../types/mcp';

export abstract class BaseTool {
  protected createdAt: string;
  protected callCount: number = 0;
  protected toolName: string;
  protected logger: CentralLogger = CentralLogger.getInstance();
  constructor(toolName: string) {
    this.createdAt = new Date().toISOString();
    this.toolName = toolName;
  }

  protected logInteraction(type: string, data: Record<string, unknown>): void {
    this.logger.logInteraction(type, { tool: this.toolName, ...data });
  }

  protected incrementCallCount(): void {
    this.callCount++;
  }

  protected createMCPResponse(requestId: string, result: Record<string, unknown>, processingStartTime: number): MCPResponse {
    const response : MCPResponse =  {
      responseId: randomUUID(),
      requestId,
      mcpVersion: '1.0',
      result,
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - processingStartTime
      }
    };
    this.logInteraction('MCP_RESPONSE', { response });
    return response;
  }

  getBaseStatus(): { toolName: string; createdAt: string; callCount: number } {
    return {
      toolName: this.toolName,
      createdAt: this.createdAt,
      callCount: this.callCount
    };
  }
}