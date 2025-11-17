#!/usr/bin/env node
/**
 * Independent CLI Client for MCP Hub
 * Uses official MCP SDK with StreamableHTTPClientTransport
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { CallToolResult, Notification } from '@modelcontextprotocol/sdk/types.js';
import * as readline from 'readline';

class SimpleCLIClient {
  private hubUrl: string;
  private clientId: string;
  private client?: Client;
  private transport?: StreamableHTTPClientTransport;
  private sessionId?: string;

  constructor(
    hubUrl: string = 'http://localhost:8000/mcp',
    clientId?: string
  ) {
    this.hubUrl = hubUrl;
    this.clientId = clientId || `cli_user_${Math.random().toString(36).substring(2, 10)}`;
  }

  async connect(): Promise<void> {
    console.log('\n🔌 Connecting to MCP Hub...');
    console.log(`   Hub URL: ${this.hubUrl}`);
    console.log(`   Client ID: ${this.clientId}\n`);

    // Create MCP client
    this.client = new Client(
      {
        name: this.clientId,
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    // Note: Incoming message notifications would be handled here if the server
    // implements them as MCP notifications. For now, messages are delivered
    // through the SSE stream which the transport handles automatically.

    // Create transport and connect
    this.transport = new StreamableHTTPClientTransport(new URL(this.hubUrl), {
      sessionId: this.sessionId,
    });

    await this.client.connect(this.transport);
    this.sessionId = this.transport.sessionId;

    console.log(`✅ Registered as: ${this.clientId} (session: ${this.sessionId})\n`);
  }

  private displayIncomingMessage(params: any): void {
    try {
      const { from_agent, payload, message_id } = params;

      console.log('\n' + '='.repeat(60));
      console.log(`📬 Incoming message from: ${from_agent}`);
      console.log('='.repeat(60));
      console.log(`Message ID: ${message_id}`);
      console.log('\nPayload:');
      console.log(JSON.stringify(payload, null, 2));
      console.log('='.repeat(60) + '\n');
      process.stdout.write('cli> '); // Restore prompt
    } catch (e) {
      console.log(`\n⚠️  Error displaying message: ${e}\n`);
    }
  }

  async listAgents(): Promise<void> {
    try {
      if (!this.client) {
        throw new Error('Client not connected');
      }

      const result = await this.client.callTool({
        name: 'list_agents',
        arguments: {},
      });

      if (!(result as any).content || !Array.isArray((result as any).content) || (result as any).content.length === 0) {
        console.log('❌ No response from server\n');
        return;
      }

      const content = (result as any).content[0];
      if (content.type !== 'text') {
        console.log('❌ Unexpected response type\n');
        return;
      }

      const data = JSON.parse(content.text);

      console.log('\n' + '='.repeat(60));
      console.log(`📋 Connected Agents (${data.total})`);
      console.log('='.repeat(60));

      for (const agent of data.agents) {
        console.log(`\n🤖 ${agent.agent_id}`);
        console.log(`   Type: ${agent.agent_type}`);
        console.log(`   Status: ${agent.status}`);
        console.log(`   Messages: ${agent.messages_processed}`);
      }

      console.log('\n' + '='.repeat(60) + '\n');
    } catch (e) {
      console.log(`❌ Failed to list agents: ${e}\n`);
    }
  }

  async sendMessage(
    toAgent: string,
    payload: Record<string, any>
  ): Promise<any> {
    try {
      if (!this.client) {
        throw new Error('Client not connected');
      }

      const result = await this.client.callTool({
        name: 'send_message',
        arguments: {
          from_agent: this.clientId,
          to_agent: toAgent,
          payload: payload,
          requires_response: true,
        },
      });

      if (!(result as any).content || !Array.isArray((result as any).content) || (result as any).content.length === 0) {
        console.log('❌ No response from server\n');
        return null;
      }

      const content = (result as any).content[0];
      if (content.type !== 'text') {
        console.log('❌ Unexpected response type\n');
        return null;
      }

      const data = JSON.parse(content.text);

      console.log('\n✅ Message sent!');
      console.log(`   Message ID: ${data.message_id}`);
      console.log(`   Conversation ID: ${data.conversation_id}`);
      console.log(`   Status: ${data.status}`);
      console.log('\n⏳ Waiting for response...\n');

      return data;
    } catch (e) {
      console.log(`❌ Failed to send message: ${e}\n`);
      return null;
    }
  }

  async disconnect(): Promise<void> {
    if (this.transport) {
      try {
        await this.transport.terminateSession();
      } catch (e) {
        // Ignore errors during termination
      }
      await this.transport.close();
    }

    if (this.client) {
      await this.client.close();
    }

    console.log('\n👋 Disconnected from hub\n');
  }
}

async function interactiveMode(): Promise<void> {
  const client = new SimpleCLIClient();

  try {
    await client.connect();

    console.log('='.repeat(60));
    console.log('🚀 MCP Hub CLI Client');
    console.log('='.repeat(60));
    console.log('\nCommands:');
    console.log('  list                - List all connected agents');
    console.log('  send <agent_id>     - Send message to an agent');
    console.log('  quit                - Exit');
    console.log('\n' + '='.repeat(60) + '\n');
    console.log('💡 This client listens for incoming messages via MCP SDK');
    console.log('   You will see messages as they arrive!\n');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    const promptUser = (prompt: string): Promise<string> => {
      return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
          resolve(answer.trim());
        });
      });
    };

    while (true) {
      const command = await promptUser('cli> ');

      if (!command) {
        continue;
      }

      const parts = command.split(/\s+/);
      const cmd = parts[0].toLowerCase();

      if (cmd === 'quit' || cmd === 'exit') {
        break;
      } else if (cmd === 'list') {
        await client.listAgents();
      } else if (cmd === 'send') {
        if (parts.length < 2) {
          console.log('Usage: send <agent_id>');
          console.log('Example: send random_agent');
          continue;
        }

        const toAgent = parts[1];
        console.log(`\nSending message to: ${toAgent}`);
        const msgInput = await promptUser('message> ');

        let payload: Record<string, any>;
        if (!msgInput) {
          payload = { action: 'request', message: 'Hello!' };
        } else {
          try {
            payload = JSON.parse(msgInput);
          } catch {
            // Treat as plain text
            payload = { action: 'request', message: msgInput };
          }
        }

        await client.sendMessage(toAgent, payload);
      } else {
        console.log(`❌ Unknown command: ${cmd}`);
        console.log('Try: list, send, quit');
      }
    }

    rl.close();
  } catch (e) {
    if ((e as any).message !== 'canceled') {
      console.error(`❌ Error: ${e}`);
    }
  } finally {
    await client.disconnect();
  }
}

async function main() {
  await interactiveMode();
}

main().catch((error) => {
  if (error.message !== 'canceled') {
    console.error('Fatal error:', error);
    process.exit(1);
  }
});
