#!/usr/bin/env node
/**
 * Independent CLI Client for MCP Hub
 * Connects via HTTP to send messages and listens via SSE to receive messages
 */

import { EventSource } from 'eventsource';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import * as readline from 'readline';

interface MessageData {
  params: {
    from_agent: string;
    message_id: string;
    payload: Record<string, any>;
    conversation_id?: string;
  };
}

class SimpleCLIClient {
  private hubUrl: string;
  private clientId: string;
  private isRunning: boolean = false;
  private eventSource?: EventSource;

  constructor(hubUrl: string = 'http://localhost:8000') {
    this.hubUrl = hubUrl.replace(/\/$/, '');
    this.clientId = `cli_user_${uuidv4().substring(0, 8)}`;
  }

  async connect(): Promise<void> {
    console.log('\n🔌 Connecting to MCP Hub...');
    console.log(`   Hub URL: ${this.hubUrl}`);
    console.log(`   Client ID: ${this.clientId}\n`);

    // Register with hub
    await this.register();

    // Start SSE listener
    this.isRunning = true;
    this.listenSSE();
  }

  private async register(): Promise<void> {
    try {
      // MCP initialize handshake
      const initRequest = {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: this.clientId,
          type: 'cli_client',
          version: '1.0.0',
        },
      };

      const response = await fetch(`${this.hubUrl}/mcp/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(initRequest),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`✅ Registered as: ${this.clientId}\n`);
    } catch (e) {
      console.error(`❌ Registration failed: ${e}`);
      throw e;
    }
  }

  private listenSSE(): void {
    const sseUrl = `${this.hubUrl}/mcp/sse/${this.clientId}`;

    const connectSSE = () => {
      if (!this.isRunning) return;

      this.eventSource = new EventSource(sseUrl);

      this.eventSource.onopen = () => {
        // Connection opened
      };

      this.eventSource.addEventListener('message', (event: any) => {
        try {
          const messageData = JSON.parse(event.data) as MessageData;
          this.displayIncomingMessage(messageData);
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      });

      this.eventSource.addEventListener('keepalive', () => {
        // Ignore keepalives
      });

      this.eventSource.onerror = (error: any) => {
        if (this.isRunning) {
          // Silently reconnect
          this.eventSource?.close();
          setTimeout(connectSSE, 2000);
        }
      };
    };

    connectSSE();
  }

  private displayIncomingMessage(messageData: MessageData): void {
    try {
      const { from_agent, payload, message_id } = messageData.params;

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
      const request = {
        jsonrpc: '2.0',
        id: `req_${uuidv4().substring(0, 8)}`,
        method: 'tools/call',
        params: {
          name: 'list_agents',
          arguments: {},
        },
      };

      const response = await fetch(`${this.hubUrl}/mcp/tools/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: any = await response.json();

      if (result.error) {
        console.log(`❌ Error: ${result.error.message}`);
        return;
      }

      // Parse result
      const content = result.result.content[0].text;
      const data = JSON.parse(content);

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
      const request = {
        jsonrpc: '2.0',
        id: `req_${uuidv4().substring(0, 8)}`,
        method: 'tools/call',
        params: {
          name: 'send_message',
          arguments: {
            from_agent: this.clientId,
            to_agent: toAgent,
            payload: payload,
            requires_response: true,
          },
        },
      };

      const response = await fetch(`${this.hubUrl}/mcp/tools/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: any = await response.json();

      if (result.error) {
        console.log(`❌ Error: ${result.error.message}`);
        return null;
      }

      // Parse result
      const content = result.result.content[0].text;
      const data = JSON.parse(content);

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
    this.isRunning = false;

    if (this.eventSource) {
      this.eventSource.close();
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
    console.log('💡 This client listens for incoming messages via SSE');
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
