#!/usr/bin/env node
/**
 * Start Atlantis A2A Server
 */

import { AtlantisA2AServer } from './infrastructure/a2a/a2a-server.js';

async function main(): Promise<void> {
  const server = new AtlantisA2AServer();
  await server.start(4000);
  
  // Keep the process alive
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down A2A server...');
    await server.stop();
    process.exit(0);
  });
}

main().catch(console.error);