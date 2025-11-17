/**
 * MCP Hub Server - Agent-to-Agent Communication Hub
 * Built with Official MCP TypeScript SDK
 *
 * Supports two transport modes:
 * - HTTP: For remote server using StreamableHTTPServerTransport (default on port 8000)
 * - stdio: For local process communication with Claude CLI
 *
 * Set TRANSPORT env var to switch: TRANSPORT=stdio or TRANSPORT=http
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
  Tool,
  isInitializeRequest,
} from '@modelcontextprotocol/sdk/types.js';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import {
  Message,
  Conversation,
  AgentInfo,
  createMessage,
  createConversation,
  createAgentInfo,
  addMessageToConversation,
  messageToJsonRpc,
} from './models.js';
import {
  HubLogger,
  LogLevel,
  LogEventType,
  LoggerConfig,
} from './logger.js';
import { InMemoryEventStore } from './eventStore.js';
import { SessionManager } from './sessionManager.js';

interface HubContext {
  agents: Map<string, AgentInfo>;
  messageQueues: Map<string, Message[]>;
  conversations: Map<string, Conversation>;
  messageLog: Message[];
  logger: HubLogger;
}

function createHubContext(loggerConfig?: Partial<LoggerConfig>): HubContext {
  const logger = new HubLogger(loggerConfig);
  logger.info(LogEventType.HUB_STARTED, 'MCP Hub Context initialized');

  return {
    agents: new Map(),
    messageQueues: new Map(),
    conversations: new Map(),
    messageLog: [],
    logger,
  };
}

interface SendMessageArgs {
  from_agent: string;
  to_agent: string;
  payload: Record<string, any>;
  conversation_id?: string;
  reply_to?: string;
  requires_response?: boolean;
}

interface RegisterAgentArgs {
  agent_id: string;
  agent_type: string;
  version?: string;
}

interface GetConversationArgs {
  conversation_id: string;
}

export class MCPHub {
  private server: Server;
  private context: HubContext;
  private sessionManager?: SessionManager;

  constructor(loggerConfig?: Partial<LoggerConfig>) {
    this.server = new Server(
      {
        name: 'autoninja-mcp-hub',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.context = createHubContext(loggerConfig);
    this.setupHandlers();
    this.context.logger.info(
      LogEventType.HUB_STARTED,
      'MCP Hub Server initialized with official SDK'
    );
  }

  private setupHandlers(): void {
    // Handle initialization request
    this.server.setRequestHandler(InitializeRequestSchema, async (request) => {
      this.context.logger.logMCPToolCall('initialize', undefined, request.params);

      return {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'autoninja-mcp-hub',
          version: '1.0.0',
        },
      };
    });

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'register_agent',
            description: 'Register an agent with the hub',
            inputSchema: {
              type: 'object',
              properties: {
                agent_id: {
                  type: 'string',
                  description: 'Unique agent identifier',
                },
                agent_type: {
                  type: 'string',
                  description: 'Type of agent',
                },
                version: {
                  type: 'string',
                  description: 'Agent version',
                  default: '0.1.0',
                },
              },
              required: ['agent_id', 'agent_type'],
            },
          },
          {
            name: 'send_message',
            description: 'Send a message to another agent',
            inputSchema: {
              type: 'object',
              properties: {
                from_agent: {
                  type: 'string',
                  description: 'Sender agent ID',
                },
                to_agent: {
                  type: 'string',
                  description: 'Recipient agent ID',
                },
                payload: {
                  type: 'object',
                  description: 'Message payload',
                },
                conversation_id: {
                  type: 'string',
                  description: 'Conversation ID (optional)',
                },
                reply_to: {
                  type: 'string',
                  description: 'Message ID being replied to (optional)',
                },
                requires_response: {
                  type: 'boolean',
                  description: 'Whether response is required',
                  default: false,
                },
              },
              required: ['from_agent', 'to_agent', 'payload'],
            },
          },
          {
            name: 'list_agents',
            description: 'List all connected agents',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_conversation',
            description: 'Get conversation history',
            inputSchema: {
              type: 'object',
              properties: {
                conversation_id: {
                  type: 'string',
                  description: 'Conversation ID',
                },
              },
              required: ['conversation_id'],
            },
          },
        ] as Tool[],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      this.context.logger.logMCPToolCall(name, undefined, args);
      const startTime = Date.now();

      try {
        let result;
        switch (name) {
          case 'register_agent':
            result = await this.handleRegisterAgent(args as unknown as RegisterAgentArgs);
            break;
          case 'send_message':
            result = await this.handleSendMessage(args as unknown as SendMessageArgs);
            break;
          case 'list_agents':
            result = await this.handleListAgents();
            break;
          case 'get_conversation':
            result = await this.handleGetConversation(args as unknown as GetConversationArgs);
            break;
          default:
            this.context.logger.error(
              LogEventType.MCP_ERROR,
              `Unknown tool: ${name}`
            );
            throw new Error(`Unknown tool: ${name}`);
        }

        const duration = Date.now() - startTime;
        this.context.logger.logMCPToolResponse(name, true, duration);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        this.context.logger.logMCPToolResponse(name, false, duration);
        this.context.logger.error(
          LogEventType.MCP_ERROR,
          `Tool ${name} failed: ${error}`
        );
        throw error;
      }
    });
  }

  private async handleRegisterAgent(args: RegisterAgentArgs) {
    const agent = createAgentInfo(
      args.agent_id,
      args.agent_type,
      args.version || '0.1.0'
    );

    this.context.agents.set(args.agent_id, agent);

    if (!this.context.messageQueues.has(args.agent_id)) {
      this.context.messageQueues.set(args.agent_id, []);
    }

    // Log the registration
    this.context.logger.logAgentRegistered(agent);

    const result = {
      status: 'registered',
      agent_id: args.agent_id,
      timestamp: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleSendMessage(args: SendMessageArgs) {
    const startTime = Date.now();

    // Validate agents
    if (!this.context.agents.has(args.from_agent)) {
      this.context.logger.error(
        LogEventType.MESSAGE_FAILED,
        `Sender agent '${args.from_agent}' not registered`
      );
      throw new Error(`Sender agent '${args.from_agent}' not registered`);
    }

    if (!this.context.agents.has(args.to_agent)) {
      this.context.logger.error(
        LogEventType.MESSAGE_FAILED,
        `Recipient agent '${args.to_agent}' not found`
      );
      throw new Error(`Recipient agent '${args.to_agent}' not found`);
    }

    // Create message
    const conversation_id =
      args.conversation_id || `conv_${uuidv4().substring(0, 12)}`;
    const message = createMessage(
      conversation_id,
      args.from_agent,
      args.to_agent,
      args.payload,
      args.reply_to,
      args.requires_response || false
    );

    // Log message sent
    this.context.logger.logMessageSent(message);

    // Add to recipient's queue
    const queue = this.context.messageQueues.get(args.to_agent)!;
    queue.push(message);

    // Track conversation
    const isNewConversation = !this.context.conversations.has(conversation_id);
    if (isNewConversation) {
      const conversation = createConversation(conversation_id, [
        args.from_agent,
        args.to_agent,
      ]);
      this.context.conversations.set(conversation_id, conversation);
      this.context.logger.logConversationStarted(conversation);
    }

    const conversation = this.context.conversations.get(conversation_id)!;
    addMessageToConversation(conversation, message);
    this.context.logger.logConversationUpdated(conversation);

    // Update sender stats
    const sender = this.context.agents.get(args.from_agent)!;
    sender.messages_processed += 1;

    // Log
    this.context.messageLog.push(message);

    // Log message delivered
    this.context.logger.logMessageDelivered(message, queue.length);

    const duration = Date.now() - startTime;
    const result = {
      status: 'delivered',
      message_id: message.message_id,
      conversation_id: conversation_id,
      queue_position: queue.length,
    };

    this.context.logger.debug(
      LogEventType.MCP_TOOL_RESPONSE,
      `send_message completed in ${duration}ms`
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleListAgents() {
    const agents_list = Array.from(this.context.agents.values()).map(
      (agent) => ({
        agent_id: agent.agent_id,
        agent_type: agent.agent_type,
        status: agent.status,
        messages_processed: agent.messages_processed,
        registered_at: agent.registered_at.toISOString(),
      })
    );

    const result = {
      total: agents_list.length,
      agents: agents_list,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleGetConversation(args: GetConversationArgs) {
    if (!this.context.conversations.has(args.conversation_id)) {
      throw new Error(`Conversation '${args.conversation_id}' not found`);
    }

    const conv = this.context.conversations.get(args.conversation_id)!;
    const result = {
      conversation_id: conv.conversation_id,
      participants: conv.participants,
      message_count: conv.messages.length,
      status: conv.status,
      messages: conv.messages.map((msg) => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
      })),
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  // ============================================================================
  // STDIO TRANSPORT (for local process communication)
  // ============================================================================
  async runStdio(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.context.logger.info(
      LogEventType.HUB_STARTED,
      'MCP Hub Server running on stdio'
    );
  }

  // ============================================================================
  // HTTP TRANSPORT (using StreamableHTTPServerTransport)
  // ============================================================================
  async runHttp(port: number = 8000): Promise<void> {
    const app = express();
    app.use(express.json());

    // Allow CORS all domains, expose the Mcp-Session-Id header
    app.use(
      cors({
        origin: '*',
        exposedHeaders: ['Mcp-Session-Id'],
      })
    );

    // Initialize session manager
    this.sessionManager = new SessionManager(this.context.logger, {
      sessionTimeout: 5 * 60 * 1000, // 5 minutes
      heartbeatInterval: 30 * 1000, // 30 seconds
      cleanupInterval: 60 * 1000, // 1 minute
      onSessionRemoved: (sessionId, clientName, reason) => {
        // Remove agent when session is removed
        if (clientName && this.context.agents.has(clientName)) {
          this.context.agents.delete(clientName);
          this.context.messageQueues.delete(clientName);
          this.context.logger.info(
            LogEventType.SSE_DISCONNECTED,
            `Agent unregistered: ${clientName} (session: ${sessionId}, reason: ${reason})`
          );
        }
      },
    });

    // MCP POST endpoint - handles requests
    app.post('/mcp', async (req: Request, res: Response) => {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;

      if (sessionId) {
        this.context.logger.debug(
          LogEventType.MCP_TOOL_CALL,
          `Received MCP request for session: ${sessionId}`
        );
      }

      try {
        let transport: StreamableHTTPServerTransport;

        if (sessionId && this.sessionManager!.hasSession(sessionId)) {
          // Reuse existing transport
          transport = this.sessionManager!.getTransport(sessionId)!;
        } else if (!sessionId && isInitializeRequest(req.body)) {
          // New initialization request
          const eventStore = new InMemoryEventStore();

          // Extract client info from request if available
          const clientInfo = req.body.params?.clientInfo;

          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            eventStore,
            onsessioninitialized: (newSessionId) => {
              // Register session with SessionManager
              this.sessionManager!.registerSession(
                newSessionId,
                transport,
                clientInfo
              );

              // Auto-register client as an agent
              if (clientInfo?.name) {
                const agent = createAgentInfo(
                  clientInfo.name,
                  'client', // Default type for auto-registered clients
                  clientInfo.version || '1.0.0'
                );
                this.context.agents.set(clientInfo.name, agent);

                if (!this.context.messageQueues.has(clientInfo.name)) {
                  this.context.messageQueues.set(clientInfo.name, []);
                }

                this.context.logger.logAgentRegistered(agent);
              }
            },
          });

          // Connect the transport to the MCP server
          await this.server.connect(transport);

          await transport.handleRequest(req, res, req.body);
          return;
        } else {
          // Invalid request
          res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: 'Bad Request: No valid session ID provided or session expired',
            },
            id: null,
          });
          return;
        }

        // Handle the request with existing transport
        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        this.context.logger.error(
          LogEventType.MCP_ERROR,
          `Error handling MCP request: ${error}`
        );
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal server error',
            },
            id: null,
          });
        }
      }
    });

    // MCP GET endpoint - handles SSE streams
    app.get('/mcp', async (req: Request, res: Response) => {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;

      if (!sessionId || !this.sessionManager!.hasSession(sessionId)) {
        res.status(400).send('Invalid, missing, or expired session ID');
        return;
      }

      // Check for Last-Event-ID header for resumability
      const lastEventId = req.headers['last-event-id'] as string | undefined;
      if (lastEventId) {
        this.context.logger.debug(
          LogEventType.SSE_CONNECTED,
          `Client reconnecting with Last-Event-ID: ${lastEventId}`,
          { sessionId }
        );
      } else {
        this.context.logger.info(
          LogEventType.SSE_CONNECTED,
          `Establishing new SSE stream for session ${sessionId}`,
          { sessionId }
        );
      }

      const transport = this.sessionManager!.getTransport(sessionId);
      if (!transport) {
        res.status(400).send('Session expired');
        return;
      }

      await transport.handleRequest(req, res);
    });

    // MCP DELETE endpoint - session termination
    app.delete('/mcp', async (req: Request, res: Response) => {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;

      if (!sessionId || !this.sessionManager!.hasSession(sessionId)) {
        res.status(400).send('Invalid or missing session ID');
        return;
      }

      this.sessionManager!.removeSession(sessionId, 'client requested termination');
      res.status(200).send('Session terminated');
    });

    // Logs API endpoints
    app.get('/logs', (req: Request, res: Response) => {
      try {
        const filter: any = {};

        if (req.query.level) {
          filter.level = req.query.level as LogLevel;
        }
        if (req.query.eventType) {
          filter.eventType = req.query.eventType as LogEventType;
        }
        if (req.query.agentId) {
          filter.agentId = req.query.agentId as string;
        }
        if (req.query.conversationId) {
          filter.conversationId = req.query.conversationId as string;
        }
        if (req.query.since) {
          filter.since = new Date(req.query.since as string);
        }

        const logs = this.context.logger.getLogs(filter);
        res.json({
          total: logs.length,
          logs: logs,
        });
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    });

    // Logs stats endpoint
    app.get('/logs/stats', (req: Request, res: Response) => {
      try {
        const stats = this.context.logger.getStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    });

    // Clear logs endpoint
    app.post('/logs/clear', (req: Request, res: Response) => {
      try {
        this.context.logger.clearLogs();
        res.json({ status: 'cleared' });
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    });

    // Sessions endpoint - get session information
    app.get('/sessions', (req: Request, res: Response) => {
      try {
        const stats = this.sessionManager!.getStats();
        const sessions = this.sessionManager!.getAllSessionIds().map(id => {
          const meta = this.sessionManager!.getSessionMetadata(id);
          return {
            sessionId: id,
            clientName: meta?.clientInfo?.name,
            clientVersion: meta?.clientInfo?.version,
            createdAt: meta?.createdAt,
            lastActivity: meta?.lastActivity,
            ageMs: Date.now() - (meta?.createdAt?.getTime() || 0),
            inactiveMs: Date.now() - (meta?.lastActivity?.getTime() || 0),
          };
        });

        res.json({
          total: stats.total,
          sessions,
          stats,
        });
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    });

    // Health check endpoint
    app.get('/health', (req: Request, res: Response) => {
      const sessionStats = this.sessionManager!.getStats();
      res.json({
        status: 'healthy',
        agents: this.context.agents.size,
        conversations: this.context.conversations.size,
        sessions: sessionStats.total,
        uptime: process.uptime(),
      });
    });

    app.listen(port, () => {
      this.context.logger.info(
        LogEventType.HUB_STARTED,
        `MCP Hub Server running on HTTP: http://localhost:${port}`
      );
      console.log(`\n📡 MCP Endpoints (Streamable HTTP Transport):`);
      console.log(`   - POST http://localhost:${port}/mcp`);
      console.log(`   - GET  http://localhost:${port}/mcp (SSE)`);
      console.log(`   - DELETE http://localhost:${port}/mcp`);
      console.log(`\n📊 Management Endpoints:`);
      console.log(`   - Health: GET http://localhost:${port}/health`);
      console.log(`   - Sessions: GET http://localhost:${port}/sessions`);
      console.log(`   - Logs: GET http://localhost:${port}/logs`);
      console.log(`   - Stats: GET http://localhost:${port}/logs/stats`);
      console.log(`\n🔄 Session Management:`);
      console.log(`   - Timeout: 5 minutes of inactivity`);
      console.log(`   - Cleanup: Every 1 minute`);
    });
  }

  getServer(): Server {
    return this.server;
  }

  getLogger(): HubLogger {
    return this.context.logger;
  }

  async shutdown(): Promise<void> {
    this.context.logger.info(LogEventType.HUB_STOPPED, 'MCP Hub shutting down');

    // Clean up session manager
    if (this.sessionManager) {
      this.sessionManager.shutdown();
    }

    this.context.logger.close();
  }
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================
async function main() {
  const hub = new MCPHub();

  // Graceful shutdown handlers
  const shutdownHandler = async (signal: string) => {
    console.log(`\n${signal} received, shutting down gracefully...`);
    await hub.shutdown();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdownHandler('SIGINT'));
  process.on('SIGTERM', () => shutdownHandler('SIGTERM'));

  // Choose transport based on environment variable or command line arg
  const transport = process.env.TRANSPORT || process.argv[2] || 'http';
  const port = parseInt(process.env.PORT || '8000', 10);

  if (transport === 'stdio') {
    console.error('📡 Using STDIO transport');
    await hub.runStdio();
  } else {
    console.error('📡 Using HTTP transport (StreamableHTTPServerTransport)');
    await hub.runHttp(port);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
