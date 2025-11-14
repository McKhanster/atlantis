#!/usr/bin/env node
/**
 * Test MCP stdio connection
 * This simulates what Claude CLI does when connecting to an MCP server
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverPath = join(__dirname, '../src/infrastructure/server/dist/server.js');

console.log('🧪 Testing MCP stdio connection...\n');
console.log(`Server path: ${serverPath}\n`);

// Spawn the server process
const server = spawn('node', [serverPath], {
  env: { ...process.env, TRANSPORT: 'stdio' },
  stdio: ['pipe', 'pipe', 'inherit'] // stdin, stdout, stderr
});

let responseData = '';

server.stdout.on('data', (data) => {
  responseData += data.toString();

  // Try to parse JSON-RPC responses
  const lines = responseData.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (line) {
      try {
        const parsed = JSON.parse(line);
        console.log('📥 Received:', JSON.stringify(parsed, null, 2));
      } catch (e) {
        // Not JSON, ignore
      }
    }
  }

  // Keep the last incomplete line
  responseData = lines[lines.length - 1];
});

// Wait for server to start
setTimeout(() => {
  console.log('📤 Sending initialize request...\n');

  // Send initialize request (MCP protocol)
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };

  server.stdin.write(JSON.stringify(initRequest) + '\n');

  // Wait for response
  setTimeout(() => {
    console.log('\n📤 Sending tools/list request...\n');

    const listToolsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    };

    server.stdin.write(JSON.stringify(listToolsRequest) + '\n');

    // Wait and then close
    setTimeout(() => {
      console.log('\n✅ Test complete!\n');
      server.kill();
      process.exit(0);
    }, 2000);
  }, 2000);
}, 1000);

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`❌ Server exited with code ${code}`);
    process.exit(code);
  }
});
