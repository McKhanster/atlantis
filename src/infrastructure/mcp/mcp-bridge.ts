/**
 * MCP Bridge - Bidirectional communication bridge for two MCP agents
 *
 * Architecture:
 * Agent1 <-> [MCP Server 1 <-> Bridge Router <-> MCP Server 2] <-> Agent2
 *
 * The bridge creates two MCP server instances and routes messages between them,
 * allowing two agents to communicate through a shared bridge context.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { JSONRPCMessage, CallToolRequest, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

/**
 * Bridge session that manages communication between two agents
 */
export interface BridgeSession {
  sessionId: string;
  agent1Id: string;
  agent2Id: string;
  agent1Transport?: Transport;
  agent2Transport?: Transport;
  createdAt: Date;
  lastActivity: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Bridge message for routing between agents
 */
export interface BridgeMessage {
  bridgeSessionId: string;
  fromAgentId: string;
  toAgentId: string;
  message: JSONRPCMessage;
  timestamp: Date;
}

/**
 * MCP Bridge that enables bidirectional communication between two agents
 */
export class McpBridge {
  private sessions: Map<string, BridgeSession> = new Map();
  private agent1Server: McpServer;
  private agent2Server: McpServer;
  private messageQueue: BridgeMessage[] = [];

  constructor(
    private bridgeId: string = uuidv4()
  ) {
    // Create two MCP server instances - one for each agent
    this.agent1Server = new McpServer({
      name: `atlantis-bridge-agent1-${this.bridgeId}`,
      version: '1.0.0'
    });

    this.agent2Server = new McpServer({
      name: `atlantis-bridge-agent2-${this.bridgeId}`,
      version: '1.0.0'
    });

    this.registerBridgeTools();
  }

  /**
   * Register bridge-specific tools on both servers
   */
  private registerBridgeTools(): void {
    // Register tool for agent1 to send messages to agent2
    this.agent1Server.registerTool('send_to_agent2', {
      description: 'Send a message to agent2 through the bridge',
      inputSchema: {
        message: z.string(),
        metadata: z.record(z.unknown()).optional()
      }
    }, async ({ message, metadata }, extra) => {
      const sessionId = this.findSessionByTransport(extra);
      if (!sessionId) {
        return {
          content: [{ type: 'text', text: 'Error: No active bridge session found' }],
          isError: true
        };
      }

      const session = this.sessions.get(sessionId);
      if (!session) {
        return {
          content: [{ type: 'text', text: 'Error: Invalid session' }],
          isError: true
        };
      }

      // Route message to agent2
      const result = await this.routeMessage(session.agent1Id, session.agent2Id, message, metadata);

      return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
        structuredContent: result
      };
    });

    // Register tool for agent2 to send messages to agent1
    this.agent2Server.registerTool('send_to_agent1', {
      description: 'Send a message to agent1 through the bridge',
      inputSchema: {
        message: z.string(),
        metadata: z.record(z.unknown()).optional()
      }
    }, async ({ message, metadata }, extra) => {
      const sessionId = this.findSessionByTransport(extra);
      if (!sessionId) {
        return {
          content: [{ type: 'text', text: 'Error: No active bridge session found' }],
          isError: true
        };
      }

      const session = this.sessions.get(sessionId);
      if (!session) {
        return {
          content: [{ type: 'text', text: 'Error: Invalid session' }],
          isError: true
        };
      }

      // Route message to agent1
      const result = await this.routeMessage(session.agent2Id, session.agent1Id, message, metadata);

      return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
        structuredContent: result
      };
    });

    // Register query tools for both agents
    this.registerQueryTools();

    // Register session management tools
    this.registerSessionTools();
  }

  /**
   * Register query tools that allow agents to query each other
   */
  private registerQueryTools(): void {
    // Agent1 can query agent2's capabilities
    this.agent1Server.registerTool('query_agent2', {
      description: 'Query agent2 for information or capabilities',
      inputSchema: {
        query: z.string(),
        context: z.record(z.unknown()).optional()
      }
    }, async ({ query, context }) => {
      const tools = Array.from(this.agent2Server['_registeredTools'].keys());
      const result = {
        availableTools: tools,
        query,
        context,
        timestamp: new Date().toISOString()
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
        structuredContent: result
      };
    });

    // Agent2 can query agent1's capabilities
    this.agent2Server.registerTool('query_agent1', {
      description: 'Query agent1 for information or capabilities',
      inputSchema: {
        query: z.string(),
        context: z.record(z.unknown()).optional()
      }
    }, async ({ query, context }) => {
      const tools = Array.from(this.agent1Server['_registeredTools'].keys());
      const result = {
        availableTools: tools,
        query,
        context,
        timestamp: new Date().toISOString()
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
        structuredContent: result
      };
    });
  }

  /**
   * Register session management tools
   */
  private registerSessionTools(): void {
    const registerSessionTool = (server: McpServer) => {
      server.registerTool('get_session_info', {
        description: 'Get information about the current bridge session',
        inputSchema: {}
      }, async (_, extra) => {
        const sessionId = this.findSessionByTransport(extra);
        const session = sessionId ? this.sessions.get(sessionId) : undefined;

        if (!session) {
          return {
            content: [{ type: 'text', text: 'No active session' }]
          };
        }

        const info = {
          sessionId: session.sessionId,
          agent1Id: session.agent1Id,
          agent2Id: session.agent2Id,
          createdAt: session.createdAt.toISOString(),
          lastActivity: session.lastActivity.toISOString(),
          metadata: session.metadata
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(info) }],
          structuredContent: info
        };
      });
    };

    registerSessionTool(this.agent1Server);
    registerSessionTool(this.agent2Server);
  }

  /**
   * Create a new bridge session for two agents
   */
  createSession(agent1Id: string, agent2Id: string, metadata?: Record<string, unknown>): BridgeSession {
    const session: BridgeSession = {
      sessionId: uuidv4(),
      agent1Id,
      agent2Id,
      createdAt: new Date(),
      lastActivity: new Date(),
      metadata
    };

    this.sessions.set(session.sessionId, session);
    return session;
  }

  /**
   * Connect agent1 to the bridge
   */
  async connectAgent1(transport: Transport, sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.agent1Transport = transport;
    session.lastActivity = new Date();

    // Set up message routing
    this.setupTransportRouting(transport, session, 'agent1');

    await this.agent1Server.connect(transport);
  }

  /**
   * Connect agent2 to the bridge
   */
  async connectAgent2(transport: Transport, sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.agent2Transport = transport;
    session.lastActivity = new Date();

    // Set up message routing
    this.setupTransportRouting(transport, session, 'agent2');

    await this.agent2Server.connect(transport);
  }

  /**
   * Set up bidirectional message routing for a transport
   */
  private setupTransportRouting(
    transport: Transport,
    session: BridgeSession,
    agentType: 'agent1' | 'agent2'
  ): void {
    const originalOnMessage = transport.onmessage;

    transport.onmessage = (message, extra) => {
      // Update session activity
      session.lastActivity = new Date();

      // Log the message for debugging
      this.logMessage(session.sessionId, agentType, message);

      // Call original handler
      if (originalOnMessage) {
        originalOnMessage(message, extra);
      }
    };

    const originalOnClose = transport.onclose;
    transport.onclose = () => {
      this.handleTransportClose(session.sessionId, agentType);
      if (originalOnClose) {
        originalOnClose();
      }
    };
  }

  /**
   * Route a message from one agent to another
   */
  private async routeMessage(
    fromAgentId: string,
    toAgentId: string,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<{ success: boolean; messageId: string; timestamp: string }> {
    const bridgeMessage: BridgeMessage = {
      bridgeSessionId: this.findSessionByAgentIds(fromAgentId, toAgentId) || '',
      fromAgentId,
      toAgentId,
      message: {
        jsonrpc: '2.0',
        method: 'notifications/message',
        params: {
          level: 'info',
          data: message,
          metadata
        }
      } as JSONRPCMessage,
      timestamp: new Date()
    };

    this.messageQueue.push(bridgeMessage);

    // Attempt to deliver the message
    const delivered = await this.deliverMessage(bridgeMessage);

    return {
      success: delivered,
      messageId: uuidv4(),
      timestamp: bridgeMessage.timestamp.toISOString()
    };
  }

  /**
   * Deliver a queued message to the target agent
   */
  private async deliverMessage(bridgeMessage: BridgeMessage): Promise<boolean> {
    const session = this.sessions.get(bridgeMessage.bridgeSessionId);
    if (!session) {
      return false;
    }

    const targetTransport = bridgeMessage.toAgentId === session.agent1Id
      ? session.agent1Transport
      : session.agent2Transport;

    if (!targetTransport) {
      return false;
    }

    try {
      // Use the server to send a notification to the target agent
      const targetServer = bridgeMessage.toAgentId === session.agent1Id
        ? this.agent1Server
        : this.agent2Server;

      // Extract params from message if it's a request
      const messageData = 'params' in bridgeMessage.message
        ? bridgeMessage.message.params
        : bridgeMessage.message;

      await targetServer.sendLoggingMessage({
        level: 'info',
        data: messageData,
        logger: `bridge-${bridgeMessage.fromAgentId}`
      });

      return true;
    } catch (error) {
      console.error('Failed to deliver message:', error);
      return false;
    }
  }

  /**
   * Find session by transport (helper for request handlers)
   */
  private findSessionByTransport(extra: any): string | undefined {
    // In a real implementation, we'd track transport -> session mapping
    // For now, return the first active session
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.agent1Transport || session.agent2Transport) {
        return sessionId;
      }
    }
    return undefined;
  }

  /**
   * Find session by agent IDs
   */
  private findSessionByAgentIds(agent1Id: string, agent2Id: string): string | undefined {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (
        (session.agent1Id === agent1Id && session.agent2Id === agent2Id) ||
        (session.agent1Id === agent2Id && session.agent2Id === agent1Id)
      ) {
        return sessionId;
      }
    }
    return undefined;
  }

  /**
   * Handle transport close
   */
  private handleTransportClose(sessionId: string, agentType: 'agent1' | 'agent2'): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    if (agentType === 'agent1') {
      session.agent1Transport = undefined;
    } else {
      session.agent2Transport = undefined;
    }

    // Clean up session if both transports are closed
    if (!session.agent1Transport && !session.agent2Transport) {
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Log message for debugging
   */
  private logMessage(sessionId: string, agentType: string, message: JSONRPCMessage): void {
    console.log(`[Bridge ${this.bridgeId}] Session ${sessionId} - ${agentType}:`,
      JSON.stringify(message, null, 2));
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): BridgeSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): BridgeSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Close a specific session
   */
  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    if (session.agent1Transport) {
      await session.agent1Transport.close();
    }
    if (session.agent2Transport) {
      await session.agent2Transport.close();
    }

    this.sessions.delete(sessionId);
  }

  /**
   * Close all sessions and shut down the bridge
   */
  async close(): Promise<void> {
    for (const sessionId of this.sessions.keys()) {
      await this.closeSession(sessionId);
    }

    await this.agent1Server.close();
    await this.agent2Server.close();
  }

  /**
   * Get the MCP server instances (for advanced usage)
   */
  getServers(): { agent1: McpServer; agent2: McpServer } {
    return {
      agent1: this.agent1Server,
      agent2: this.agent2Server
    };
  }

  /**
   * Get bridge ID
   */
  getBridgeId(): string {
    return this.bridgeId;
  }
}
