#!/usr/bin/env node
/**
 * Atlantis Core MCP Server Entry Point
 * Main executable for the MCP server with agent-to-agent communication hub
 */

import { MCPHub } from './server';

/**
 * Main entry point for Atlantis Core MCP Server
 * Supports both HTTP and stdio transports based on environment
 */
async function main(): Promise<void> {
  const hub = new MCPHub();

  // Choose transport based on environment variable or command line arg
  const transport = process.env.TRANSPORT || process.argv[2] || 'http';
  const port = parseInt(process.env.PORT || '8000', 10);

  if (transport === 'stdio') {
    console.error('📡 Atlantis Core using STDIO transport');
    await hub.runStdio();
  } else {
    console.error('📡 Atlantis Core using HTTP transport');
    await hub.runHttp(port);
  }
}

// Always run when imported as CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

// Export for programmatic use
export { MCPHub } from './server';
export * from './server';