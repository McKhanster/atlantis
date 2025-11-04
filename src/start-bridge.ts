#!/usr/bin/env node

/**
 * MCP Bridge Standalone Starter
 *
 * Starts the MCP Bridge server for bidirectional agent communication
 */

import { startBridgeServer } from './infrastructure/mcp/mcp-bridge-server.js';

async function main() {
  const port = parseInt(process.env.BRIDGE_PORT || '3100');
  const host = process.env.BRIDGE_HOST || 'localhost';

  console.log('🚀 Starting MCP Bridge Server...\n');

  try {
    const server = await startBridgeServer({
      port,
      host,
      cors: true
    });

    console.log('\n✅ MCP Bridge Server started successfully!');
    console.log('\nAvailable endpoints:');
    console.log(`  - Health check:    http://${host}:${port}/health`);
    console.log(`  - Create session:  POST http://${host}:${port}/sessions`);
    console.log(`  - List sessions:   GET http://${host}:${port}/sessions`);
    console.log('\nUsage example:');
    console.log(`  curl -X POST http://${host}:${port}/sessions \\`);
    console.log(`    -H "Content-Type: application/json" \\`);
    console.log(`    -d '{"agent1Id": "agent1", "agent2Id": "agent2"}'`);
    console.log('\nPress Ctrl+C to stop the server');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Shutting down MCP Bridge Server...');
      await server.stop();
      console.log('✅ Server stopped gracefully');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n\n🛑 Shutting down MCP Bridge Server...');
      await server.stop();
      console.log('✅ Server stopped gracefully');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start MCP Bridge Server:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
