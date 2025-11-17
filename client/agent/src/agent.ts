#!/usr/bin/env node
/**
 * Random Number Agent
 * Connects to MCP Hub, waits for messages, and replies with random numbers
 */

import { EventSource } from 'eventsource';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

interface MessageData {
  params: {
    from_agent: string;
    message_id: string;
    conversation_id: string;
    payload: Record<string, any>;
  };
}

class RandomAgent {
  private agentId: string;
  private hubUrl: string;
  private isRunning: boolean = false;
  private eventSource?: EventSource;

  constructor(
    agentId: string = 'random_agent',
    hubUrl: string = 'http://localhost:8000'
  ) {
    this.agentId = agentId;
    this.hubUrl = hubUrl.replace(/\/$/, '');

    console.log(`🤖 Created ${this.agentId}`);
  }

  private sessionId?: string;

  async initialize(): Promise<boolean> {
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
            name: this.agentId,
            version: '1.0.0',
          },
        },
      };

      const response = await fetch(`${this.hubUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
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

      console.log(`✅ ${this.agentId} connected to hub (session: ${this.sessionId})`);

      // Start SSE listener
      this.isRunning = true;
      this.listenSSE();

      console.log(`✅ ${this.agentId} ready and waiting for messages`);

      return true;
    } catch (e) {
      console.error(`❌ ${this.agentId} initialization failed: ${e}`);
      return false;
    }
  }

  private listenSSE(): void {
    if (!this.sessionId) {
      console.error('❌ Cannot listen for SSE without session ID');
      return;
    }

    const sseUrl = `${this.hubUrl}/mcp`;

    console.log(`🔌 ${this.agentId} connecting to SSE: ${sseUrl}`);

    const connectSSE = () => {
      if (!this.isRunning || !this.sessionId) return;

      // EventSource doesn't support custom headers, so we need to use a workaround
      // For now, use fetch with SSE support
      this.connectSSEWithFetch();
    };

    connectSSE();
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

      console.log(`🔌 ${this.agentId} SSE connected`);

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
                this.handleIncomingMessage(messageData);
              }
            } catch (e) {
              // Ignore parse errors for non-JSON data like keepalive
            }
          }
        }
      });

      response.body.on('end', () => {
        if (this.isRunning) {
          console.log(`🔄 ${this.agentId} SSE stream ended, reconnecting in 2s...`);
          setTimeout(() => this.connectSSEWithFetch(), 2000);
        }
      });

      response.body.on('error', (error: Error) => {
        if (this.isRunning) {
          console.error(`❌ ${this.agentId} SSE error: ${error}`);
          console.log(`🔄 ${this.agentId} reconnecting in 2s...`);
          setTimeout(() => this.connectSSEWithFetch(), 2000);
        }
      });
    } catch (e) {
      if (this.isRunning) {
        console.error(`❌ ${this.agentId} SSE error: ${e}`);
        console.log(`🔄 ${this.agentId} reconnecting in 2s...`);
        setTimeout(() => this.connectSSEWithFetch(), 2000);
      }
    }
  }

  private async handleIncomingMessage(messageData: MessageData): Promise<void> {
    try {
      const { from_agent, message_id, conversation_id, payload } =
        messageData.params;

      console.log(`📬 ${this.agentId} received message from ${from_agent}`);
      console.log(`   Message ID: ${message_id}`);
      console.log(`   Payload: ${JSON.stringify(payload)}`);

      // Generate random number
      const randomNumber = Math.floor(Math.random() * 1000) + 1;
      console.log(`🎲 Generated random number: ${randomNumber}`);

      // Send reply with random number
      await this.sendMessage(
        from_agent,
        {
          action: 'response',
          random_number: randomNumber,
          message: `Here's your random number: ${randomNumber}`,
          original_request: payload,
        },
        conversation_id,
        message_id,
        false
      );

      console.log(
        `✅ ${this.agentId} sent reply with random number ${randomNumber}`
      );
    } catch (e) {
      console.error(`❌ ${this.agentId} error handling message: ${e}`);
    }
  }

  async sendMessage(
    toAgent: string,
    payload: Record<string, any>,
    conversationId?: string,
    replyTo?: string,
    requiresResponse: boolean = false
  ): Promise<void> {
    try {
      if (!this.sessionId) {
        throw new Error('No session ID - agent not initialized');
      }

      const request = {
        jsonrpc: '2.0',
        id: `req_${uuidv4().substring(0, 8)}`,
        method: 'tools/call',
        params: {
          name: 'send_message',
          arguments: {
            from_agent: this.agentId,
            to_agent: toAgent,
            payload: payload,
            conversation_id: conversationId,
            reply_to: replyTo,
            requires_response: requiresResponse,
          },
        },
      };

      const response = await fetch(`${this.hubUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Mcp-Session-Id': this.sessionId,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`📤 ${this.agentId} → ${toAgent}: message sent`);
    } catch (e) {
      console.error(`❌ ${this.agentId} failed to send message: ${e}`);
    }
  }

  async shutdown(): Promise<void> {
    console.log(`🛑 Shutting down ${this.agentId}`);

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
        // Ignore errors during shutdown
      }
    }

    console.log(`✅ ${this.agentId} shutdown complete`);
  }
}

async function main() {
  const agent = new RandomAgent();

  try {
    console.log('\n' + '='.repeat(60));
    console.log('🎲 Random Number Agent');
    console.log('='.repeat(60));
    console.log('Starting agent...');
    console.log('Agent will wait for messages and reply with random numbers');
    console.log('Press Ctrl+C to stop');
    console.log('='.repeat(60) + '\n');

    const success = await agent.initialize();

    if (!success) {
      console.log('❌ Failed to initialize agent');
      process.exit(1);
    }

    // Keep running until interrupted
    await new Promise<void>((resolve) => {
      process.on('SIGINT', () => {
        console.log('\n⚠️  Agent interrupted');
        resolve();
      });
      process.on('SIGTERM', () => {
        resolve();
      });
    });
  } catch (e) {
    console.error(`❌ Agent error: ${e}`);
  } finally {
    await agent.shutdown();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
