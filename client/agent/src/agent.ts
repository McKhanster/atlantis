#!/usr/bin/env node
/**
 * Random Number Agent
 * Connects to MCP Hub, waits for messages, and replies with random numbers
 */

import EventSource from 'eventsource';
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

  async initialize(): Promise<boolean> {
    try {
      // MCP initialize handshake
      const initRequest = {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: this.agentId,
          type: 'random_number_agent',
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

      console.log(`✅ ${this.agentId} connected to hub`);

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
    const sseUrl = `${this.hubUrl}/mcp/sse/${this.agentId}`;

    console.log(`🔌 ${this.agentId} connecting to SSE: ${sseUrl}`);

    const connectSSE = () => {
      if (!this.isRunning) return;

      this.eventSource = new EventSource(sseUrl);

      this.eventSource.onopen = () => {
        console.log(`🔌 ${this.agentId} SSE connected`);
      };

      this.eventSource.addEventListener('message', (event: any) => {
        try {
          const messageData = JSON.parse(event.data) as MessageData;
          this.handleIncomingMessage(messageData);
        } catch (e) {
          console.error(`Error parsing message: ${e}`);
        }
      });

      this.eventSource.addEventListener('keepalive', () => {
        // Just a keepalive, ignore
      });

      this.eventSource.onerror = (error) => {
        if (this.isRunning) {
          console.error(`❌ ${this.agentId} SSE error: ${error}`);
          console.log(`🔄 ${this.agentId} reconnecting in 2s...`);
          this.eventSource?.close();
          setTimeout(connectSSE, 2000);
        }
      };
    };

    connectSSE();
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
