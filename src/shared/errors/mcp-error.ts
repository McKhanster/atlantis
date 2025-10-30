/**
 * MCP-specific error classes
 */

import { MCPErrorCode } from '../../types/mcp';

export class MCPError extends Error {
  constructor(
    message: string,
    public readonly code: MCPErrorCode,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'MCPError';
  }
}
