#!/usr/bin/env node
/**
 * MCP Client - CLI interface for connecting to MCP servers
 * Replaces LLM with direct CLI interaction
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as readline from 'readline';
import { A2AClient } from "@a2a-js/sdk/client";
import { Message, MessageSendParams, SendMessageSuccessResponse } from "@a2a-js/sdk";
import { v4 as uuidv4 } from "uuid";

async function run() {
  // Create a client pointing to the agent's Agent Card URL.
  const client = await A2AClient.fromCardUrl("http://localhost:4000/.well-known/agent-card.json");

  const sendParams: MessageSendParams = {
    message: {
      messageId: uuidv4(),
      role: "user",
      parts: [{ kind: "text", text: "Hi there!" }],
      kind: "message",
    },
  };

  const response = await client.sendMessage(sendParams);

  if ("error" in response) {
    console.error("Error:", response.error.message);
  } else {
    const result = (response as SendMessageSuccessResponse).result as Message;
    console.log("Agent response:", result.parts[0]); // "Hello, world!"
  }
}

await run();

export class MCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async connectToServer(serverCommand: string, serverArgs: string[] = []): Promise<void> {
    console.log(`🔌 Connecting to MCP server: ${serverCommand} ${serverArgs.join(' ')}`);
    
    try {
      // Create transport with server parameters
      this.transport = new StdioClientTransport({
        command: serverCommand,
        args: serverArgs
      });

      // Create client
      this.client = new Client({
        name: 'atlantis-mcp-client',
        version: '1.0.0'
      }, {
        capabilities: {}
      });

      // Connect to transport (this calls start() automatically)
      await this.client.connect(this.transport);
      console.log('✅ Connected to MCP server');

      // List available tools
      await this.listTools();
    } catch (error) {
      console.error('❌ Failed to connect to server:', error);
      throw error;
    }
  }

  async listTools(): Promise<void> {
    if (!this.client) {
      console.error('❌ No active client');
      return;
    }

    try {
      const response = await this.client.listTools();
      console.log('\n🛠️  Available tools:');
      
      if (response.tools.length === 0) {
        console.log('  No tools available');
        return;
      }

      response.tools.forEach((tool, index) => {
        console.log(`  ${index + 1}. ${tool.name}`);
        console.log(`     Description: ${tool.description || 'No description'}`);
        if (tool.inputSchema) {
          console.log(`     Input schema: ${JSON.stringify(tool.inputSchema, null, 2)}`);
        }
        console.log('');
      });
    } catch (error) {
      console.error('❌ Failed to list tools:', error);
    }
  }

  async callTool(toolName: string, args: Record<string, unknown> = {}): Promise<void> {
    if (!this.client) {
      console.error('❌ No active client');
      return;
    }

    try {
      console.log(`🔧 Calling tool: ${toolName}`);
      console.log(`📝 Arguments: ${JSON.stringify(args, null, 2)}`);
      
      const result = await this.client.callTool({
        name: toolName,
        arguments: args
      });
      
      console.log('✅ Tool result:');
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('❌ Tool call failed:', error);
    }
  }

  private parseCommand(input: string): { command: string; args: string[] } {
    const parts = input.trim().split(/\s+/);
    return {
      command: parts[0] || '',
      args: parts.slice(1)
    };
  }

  private parseToolArgs(argsString: string): Record<string, unknown> {
    if (!argsString.trim()) {
      return {};
    }

    try {
      // Try to parse as JSON first
      return JSON.parse(argsString);
    } catch {
      // If not JSON, treat as simple key=value pairs
      const args: Record<string, unknown> = {};
      const pairs = argsString.split(/\s+/);
      
      for (const pair of pairs) {
        const [key, ...valueParts] = pair.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=');
          // Try to parse as number or boolean
          if (value === 'true') args[key] = true;
          else if (value === 'false') args[key] = false;
          else if (!isNaN(Number(value))) args[key] = Number(value);
          else args[key] = value;
        }
      }
      
      return args;
    }
  }

  

  async startChatLoop(): Promise<void> {
    console.log('\n🚀 MCP Client Started!');
    console.log('Commands:');
    console.log('  tools                    - List available tools');
    console.log('  call <tool> [args]       - Call a tool with optional arguments');
    console.log('  help                     - Show this help');
    console.log('  quit                     - Exit the client');
    console.log('\nArguments can be JSON: {"key": "value"} or key=value pairs');
    console.log('');

    while (true) {
      try {
        const input = await this.prompt('> ');
        const { command, args } = this.parseCommand(input);

        switch (command.toLowerCase()) {
          case 'quit':
          case 'exit':
            console.log('👋 Goodbye!');
            return;

          case 'help':
            console.log('\nCommands:');
            console.log('  tools                    - List available tools');
            console.log('  call <tool> [args]       - Call a tool with optional arguments');
            console.log('  help                     - Show this help');
            console.log('  quit                     - Exit the client');
            console.log('\nArguments can be JSON: {"key": "value"} or key=value pairs');
            break;

          case 'tools':
            await this.listTools();
            break;

          case 'call':
            if (args.length === 0) {
              console.log('❌ Usage: call <tool_name> [arguments]');
              break;
            }
            
            const toolName = args[0];
            const argsString = args.slice(1).join(' ');
            const toolArgs = this.parseToolArgs(argsString);
            
            await this.callTool(toolName, toolArgs);
            break;
          case 'a2a':
            await run();
          case '':
            // Empty command, just continue
            break;

          default:
            console.log(`❌ Unknown command: ${command}`);
            console.log('Type "help" for available commands');
        }
      } catch (error) {
        console.error('❌ Error:', error);
      }
    }
  }

  private prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }

  async cleanup(): Promise<void> {
    this.rl.close();
    if (this.transport) {
      await this.transport.close();
    }
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node client.js <server_command> [server_args...]');
    console.log('');
    console.log('Examples:');
    console.log('  node client.js node ../dist/index.js');
    console.log('  node client.js python server.py');
    process.exit(1);
  }

  const [serverCommand, ...serverArgs] = args;
  const client = new MCPClient();

  try {
    await client.connectToServer(serverCommand, serverArgs);
    await client.startChatLoop();
  } catch (error) {
    console.error('❌ Client error:', error);
    process.exit(1);
  } finally {
    await client.cleanup();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

