/**
 * MCP-specific error classes
 */

import { AtlantisErrorCode } from '../../types/mcp.js';

export class MCPError extends Error {
  constructor(
    message: string,
    public readonly code: AtlantisErrorCode,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'MCPError';
  }
}
