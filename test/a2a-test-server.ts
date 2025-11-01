#!/usr/bin/env node
/**
 * A2A Test Server
 * Simple test server to verify A2A implementation
 */

import { AtlantisA2AServer } from '../src/infrastructure/a2a/a2a-server.js';

async function main(): Promise<void> {
  const server = new AtlantisA2AServer();
  
  try {
    console.log('🚀 Starting Atlantis A2A Test Server...');
    await server.start(4000);
    
    console.log('✅ A2A Server is running!');
    console.log('📋 Test the agent card: curl http://localhost:4000/.well-known/agent-card.json');
    console.log('🏥 Test health check: curl http://localhost:4000/health');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down A2A server...');
      await server.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start A2A server:', error);
    process.exit(1);
  }
}

// ESM equivalent of require.main === module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}