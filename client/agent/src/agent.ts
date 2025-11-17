#!/usr/bin/env node
/**
 * Random Number Agent
 * Uses official MCP SDK to connect to hub and respond to messages
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Notification } from '@modelcontextprotocol/sdk/types.js';

interface MessageNotification {
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
  private client?: Client;
  private transport?: StreamableHTTPClientTransport;
  private sessionId?: string;
  private isRunning: boolean = false;

  constructor(
    agentId: string = 'random_agent',
    hubUrl: string = 'http://localhost:8000/mcp'
  ) {
    this.agentId = agentId;
    this.hubUrl = hubUrl;

    console.log(`🤖 Created ${this.agentId}`);
  }

  async initialize(): Promise<boolean> {
    try {
      // Create MCP client
      this.client = new Client(
        {
          name: this.agentId,
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      // Note: Notification handler would be set up here once the hub
      // implements message delivery via MCP notifications.
      // For now, messages are queued on the hub but not actively delivered.

      // Create transport and connect
      this.transport = new StreamableHTTPClientTransport(new URL(this.hubUrl), {
        sessionId: this.sessionId,
      });

      await this.client.connect(this.transport);
      this.sessionId = this.transport.sessionId;

      console.log(`✅ ${this.agentId} connected to hub (session: ${this.sessionId})`);

      // Mark as running
      this.isRunning = true;

      console.log(`✅ ${this.agentId} ready and waiting for messages`);
      console.log(`   Note: Message delivery notifications not yet implemented in hub`);

      return true;
    } catch (e) {
      console.error(`❌ ${this.agentId} initialization failed: ${e}`);
      return false;
    }
  }

  private async handleIncomingMessage(
    notification: MessageNotification
  ): Promise<void> {
    try {
      const { from_agent, message_id, conversation_id, payload } =
        notification.params;

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
      if (!this.client) {
        throw new Error('Client not initialized');
      }

      await this.client.callTool({
        name: 'send_message',
        arguments: {
          from_agent: this.agentId,
          to_agent: toAgent,
          payload: payload,
          conversation_id: conversationId,
          reply_to: replyTo,
          requires_response: requiresResponse,
        },
      });

      console.log(`📤 ${this.agentId} → ${toAgent}: message sent`);
    } catch (e) {
      console.error(`❌ ${this.agentId} failed to send message: ${e}`);
    }
  }

  async shutdown(): Promise<void> {
    console.log(`🛑 Shutting down ${this.agentId}`);

    this.isRunning = false;

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
