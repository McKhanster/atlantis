#!/usr/bin/env node
/**
 * Atlantis Core MCP Server Entry Point
 * Main executable for the MCP server
 */

import { AtlantisMcpServer } from './infrastructure/mcp/mcp-server.js';

async function main(): Promise<void> {
  const server = new AtlantisMcpServer();
  await server.start();
}

// Always run when imported as CLI
main().catch(console.error);

// Export for programmatic use
export { AtlantisMcpServer } from './infrastructure/mcp/mcp-server.js';
export * from './types/index.js';