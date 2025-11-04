/**
 * MCP Bridge HTTP Server
 *
 * Provides HTTP endpoints for agents to connect to the bridge.
 * Supports both StreamableHTTP and SSE transports.
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { McpBridge } from './mcp-bridge.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { v4 as uuidv4 } from 'uuid';

export interface BridgeServerConfig {
  port?: number;
  host?: string;
  cors?: boolean;
}

/**
 * HTTP Server wrapper for MCP Bridge
 */
export class McpBridgeServer {
  private app: express.Application;
  private bridge: McpBridge;
  private port: number;
  private host: string;
  private sessionMap: Map<string, string> = new Map(); // transport sessionId -> bridge sessionId

  constructor(config: BridgeServerConfig = {}) {
    this.port = config.port || 3100;
    this.host = config.host || 'localhost';
    this.app = express();
    this.bridge = new McpBridge();

    this.setupMiddleware(config.cors !== false);
    this.setupRoutes();
  }

  /**
   * Set up Express middleware
   */
  private setupMiddleware(enableCors: boolean): void {
    this.app.use(express.json());

    if (enableCors) {
      this.app.use(cors());
    }

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`[Bridge Server] ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Set up HTTP routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        bridgeId: this.bridge.getBridgeId(),
        activeSessions: this.bridge.getActiveSessions().length,
        timestamp: new Date().toISOString()
      });
    });

    // Create a new bridge session
    this.app.post('/sessions', (req, res) => {
      const { agent1Id, agent2Id, metadata } = req.body;

      if (!agent1Id || !agent2Id) {
        res.status(400).json({
          error: 'agent1Id and agent2Id are required'
        });
        return;
      }

      const session = this.bridge.createSession(agent1Id, agent2Id, metadata);

      res.json({
        sessionId: session.sessionId,
        agent1Endpoint: `/bridge/agent1/${session.sessionId}`,
        agent2Endpoint: `/bridge/agent2/${session.sessionId}`,
        createdAt: session.createdAt.toISOString()
      });
    });

    // Get session info
    this.app.get('/sessions/:sessionId', (req, res) => {
      const session = this.bridge.getSession(req.params.sessionId);

      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      res.json({
        sessionId: session.sessionId,
        agent1Id: session.agent1Id,
        agent2Id: session.agent2Id,
        createdAt: session.createdAt.toISOString(),
        lastActivity: session.lastActivity.toISOString(),
        metadata: session.metadata
      });
    });

    // List all active sessions
    this.app.get('/sessions', (req, res) => {
      const sessions = this.bridge.getActiveSessions().map(s => ({
        sessionId: s.sessionId,
        agent1Id: s.agent1Id,
        agent2Id: s.agent2Id,
        createdAt: s.createdAt.toISOString(),
        lastActivity: s.lastActivity.toISOString()
      }));

      res.json({ sessions, count: sessions.length });
    });

    // Delete a session
    this.app.delete('/sessions/:sessionId', async (req, res) => {
      await this.bridge.closeSession(req.params.sessionId);
      res.json({ success: true });
    });

    // MCP endpoint for agent1
    this.app.post('/bridge/agent1/:sessionId', async (req, res) => {
      await this.handleMcpRequest(req, res, 'agent1');
    });

    // MCP endpoint for agent2
    this.app.post('/bridge/agent2/:sessionId', async (req, res) => {
      await this.handleMcpRequest(req, res, 'agent2');
    });
  }

  /**
   * Handle MCP requests from agents
   */
  private async handleMcpRequest(
    req: Request,
    res: Response,
    agentType: 'agent1' | 'agent2'
  ): Promise<void> {
    const bridgeSessionId = req.params.sessionId;

    const session = this.bridge.getSession(bridgeSessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    try {
      // Create a transport for this request
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => uuidv4(),
        enableJsonResponse: true
      });

      // Store the transport session mapping
      if (transport.sessionId) {
        this.sessionMap.set(transport.sessionId, bridgeSessionId);
      }

      // Handle connection close
      res.on('close', () => {
        if (transport.sessionId) {
          this.sessionMap.delete(transport.sessionId);
        }
        transport.close();
      });

      // Connect the transport to the appropriate MCP server in the bridge
      if (agentType === 'agent1') {
        await this.bridge.connectAgent1(transport, bridgeSessionId);
      } else {
        await this.bridge.connectAgent2(transport, bridgeSessionId);
      }

      // Handle the HTTP request
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error(`Error handling MCP request for ${agentType}:`, error);

      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  /**
   * Start the bridge server
   */
  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, this.host, () => {
        console.log(`🌉 MCP Bridge Server running at http://${this.host}:${this.port}`);
        console.log(`   Bridge ID: ${this.bridge.getBridgeId()}`);
        console.log(`   Health check: http://${this.host}:${this.port}/health`);
        console.log(`   Create session: POST http://${this.host}:${this.port}/sessions`);
        resolve();
      });
    });
  }

  /**
   * Stop the bridge server
   */
  async stop(): Promise<void> {
    await this.bridge.close();
  }

  /**
   * Get the underlying bridge instance
   */
  getBridge(): McpBridge {
    return this.bridge;
  }
}

/**
 * Main entry point for running the bridge server standalone
 */
export async function startBridgeServer(config?: BridgeServerConfig): Promise<McpBridgeServer> {
  const server = new McpBridgeServer(config);
  await server.start();
  return server;
}
