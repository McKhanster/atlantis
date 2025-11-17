#!/usr/bin/env node
/**
 * Independent CLI Client for MCP Hub
 * Connects via HTTP to send messages and listens via SSE to receive messages
 */

import { EventSource } from 'eventsource';
import fetch, { Response } from 'node-fetch';
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
  private sessionId?: string;
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
      // MCP initialize handshake using JSON-RPC 2.0
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: this.clientId,
            version: '1.0.0',
          },
        },
      };

      const response = await fetch(`${this.hubUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify(initRequest),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Get session ID from response headers
      this.sessionId = response.headers.get('mcp-session-id') || undefined;

      if (!this.sessionId) {
        throw new Error('No session ID received from hub');
      }

      console.log(`✅ Registered as: ${this.clientId} (session: ${this.sessionId})\n`);
    } catch (e) {
      console.error(`❌ Registration failed: ${e}`);
      throw e;
    }
  }

  private listenSSE(): void {
    if (!this.sessionId) {
      console.error('❌ Cannot listen for SSE without session ID');
      return;
    }

    // Note: EventSource doesn't support custom headers
    // For production, use fetch with SSE support or a library that supports headers
    // For now, this is a simplified implementation
    this.connectSSEWithFetch();
  }

  private async connectSSEWithFetch(): Promise<void> {
    if (!this.sessionId) return;

    try {
      const response = await fetch(`${this.hubUrl}/mcp`, {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
          'Mcp-Session-Id': this.sessionId,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Read SSE stream using node-fetch's body methods
      if (!response.body) {
        throw new Error('No response body');
      }

      let buffer = '';

      // Listen for data chunks
      response.body.on('data', (chunk: Buffer) => {
        if (!this.isRunning) return;

        buffer += chunk.toString();
        const lines = buffer.split('\n');

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            try {
              const messageData = JSON.parse(data);
              // Check if this is a notification with our expected format
              if (messageData.method === 'notifications/message') {
                this.displayIncomingMessage(messageData);
              }
            } catch (e) {
              // Ignore parse errors for non-JSON data like keepalive
            }
          }
        }
      });

      response.body.on('end', () => {
        if (this.isRunning) {
          console.log(`\n🔄 SSE stream ended, reconnecting in 2s...\n`);
          setTimeout(() => this.connectSSEWithFetch(), 2000);
        }
      });

      response.body.on('error', (error: Error) => {
        if (this.isRunning) {
          console.error(`\n❌ SSE error: ${error}`);
          console.log(`🔄 Reconnecting in 2s...\n`);
          setTimeout(() => this.connectSSEWithFetch(), 2000);
        }
      });
    } catch (e) {
      if (this.isRunning) {
        console.error(`\n❌ SSE error: ${e}`);
        console.log(`🔄 Reconnecting in 2s...\n`);
        setTimeout(() => this.connectSSEWithFetch(), 2000);
      }
    }
  }

  /**
   * Parse response - handles both JSON and SSE formats
   */
  private async parseResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type');

    // If content-type is SSE, parse the SSE format
    if (contentType && contentType.includes('text/event-stream')) {
      // Read the stream manually until we get a complete message
      if (!response.body) {
        throw new Error('No response body');
      }

      let buffer = '';

      // Read chunks until we get a complete SSE message (ends with \n\n)
      for await (const chunk of response.body) {
        buffer += chunk.toString();

        // Check if we have a complete message (ends with \n\n)
        if (buffer.includes('\n\n')) {
          break;
        }
      }

      // Parse SSE format: event: message\nid: xxx\ndata: {...}\n\n
      const lines = buffer.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.substring(6); // Remove 'data: ' prefix
          return JSON.parse(jsonStr);
        }
      }
      throw new Error('No data found in SSE response');
    }

    // Otherwise, parse as regular JSON
    return await response.json();
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
      if (!this.sessionId) {
        throw new Error('No session ID - client not connected');
      }

      const request = {
        jsonrpc: '2.0',
        id: `req_${uuidv4().substring(0, 8)}`,
        method: 'tools/call',
        params: {
          name: 'list_agents',
          arguments: {},
        },
      };

      const response = await fetch(`${this.hubUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
          'Mcp-Session-Id': this.sessionId,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: any = await this.parseResponse(response);

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
      if (!this.sessionId) {
        throw new Error('No session ID - client not connected');
      }

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

      const response = await fetch(`${this.hubUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
          'Mcp-Session-Id': this.sessionId,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: any = await this.parseResponse(response);

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

    // Close MCP session
    if (this.sessionId) {
      try {
        await fetch(`${this.hubUrl}/mcp`, {
          method: 'DELETE',
          headers: {
            'Mcp-Session-Id': this.sessionId,
          },
        });
      } catch (e) {
        // Ignore errors during disconnect
      }
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
