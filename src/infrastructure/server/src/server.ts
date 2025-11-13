/**
 * MCP Hub Server - Agent-to-Agent Communication Hub
 * Built with Official MCP TypeScript SDK
 *
 * Supports two transport modes:
 * - HTTP: For remote server (default on port 8000)
 * - stdio: For local process communication
 *
 * Set TRANSPORT env var to switch: TRANSPORT=stdio or TRANSPORT=http
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import express, { Request, Response } from 'express';
import cors from 'cors';
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

interface HubContext {
  agents: Map<string, AgentInfo>;
  messageQueues: Map<string, Message[]>;
  conversations: Map<string, Conversation>;
  messageLog: Message[];
  agentSessions: Map<string, any>;
  sseClients: Map<string, Response>; // Active SSE connections for HTTP mode
}

function createHubContext(): HubContext {
  console.error('🚀 MCP Hub Context initialized');
  return {
    agents: new Map(),
    messageQueues: new Map(),
    conversations: new Map(),
    messageLog: [],
    agentSessions: new Map(),
    sseClients: new Map(),
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

  constructor() {
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

    this.context = createHubContext();
    this.setupHandlers();
    console.error('🚀 MCP Hub Server initialized with official SDK');
  }

  private setupHandlers(): void {
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

      switch (name) {
        case 'register_agent':
          return await this.handleRegisterAgent(args as unknown as RegisterAgentArgs);
        case 'send_message':
          return await this.handleSendMessage(args as unknown as SendMessageArgs);
        case 'list_agents':
          return await this.handleListAgents();
        case 'get_conversation':
          return await this.handleGetConversation(args as unknown as GetConversationArgs);
        default:
          throw new Error(`Unknown tool: ${name}`);
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

    console.error(`✅ Agent registered: ${args.agent_id}`);

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
    // Validate agents
    if (!this.context.agents.has(args.from_agent)) {
      throw new Error(`Sender agent '${args.from_agent}' not registered`);
    }

    if (!this.context.agents.has(args.to_agent)) {
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

    // Add to recipient's queue
    const queue = this.context.messageQueues.get(args.to_agent)!;
    queue.push(message);

    // Track conversation
    if (!this.context.conversations.has(conversation_id)) {
      const conversation = createConversation(conversation_id, [
        args.from_agent,
        args.to_agent,
      ]);
      this.context.conversations.set(conversation_id, conversation);
    }

    const conversation = this.context.conversations.get(conversation_id)!;
    addMessageToConversation(conversation, message);

    // Update sender stats
    const sender = this.context.agents.get(args.from_agent)!;
    sender.messages_processed += 1;

    // Log
    this.context.messageLog.push(message);
    console.error(
      `📨 ${args.from_agent} → ${args.to_agent}: ${message.message_id}`
    );

    // Send notification to recipient if they have a session (stdio mode)
    if (this.context.agentSessions.has(args.to_agent)) {
      const session = this.context.agentSessions.get(args.to_agent);
      try {
        await session.notification({
          method: 'notifications/message',
          params: messageToJsonRpc(message).params,
        });
      } catch (e) {
        console.error(`Failed to notify ${args.to_agent}: ${e}`);
      }
    }

    // Send via SSE if client is connected (HTTP mode)
    if (this.context.sseClients.has(args.to_agent)) {
      const sseClient = this.context.sseClients.get(args.to_agent);
      try {
        const sseData = `event: message\ndata: ${JSON.stringify(
          messageToJsonRpc(message)
        )}\n\n`;
        sseClient!.write(sseData);
      } catch (e) {
        console.error(`Failed to send SSE to ${args.to_agent}: ${e}`);
        this.context.sseClients.delete(args.to_agent);
      }
    }

    const result = {
      status: 'delivered',
      message_id: message.message_id,
      conversation_id: conversation_id,
      queue_position: queue.length,
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
    console.error('🚀 MCP Hub Server running on stdio');
  }

  // ============================================================================
  // HTTP TRANSPORT (for remote communication)
  // ============================================================================
  async runHttp(port: number = 8000): Promise<void> {
    const app = express();

    // Middleware
    app.use(cors());
    app.use(express.json());

    // ============================================================================
    // STANDARD MCP SSE ENDPOINT (for standard MCP clients like Claude Desktop)
    // ============================================================================
    app.post('/sse', async (req: Request, res: Response) => {
      console.error('🔌 Standard MCP SSE connection initiated');

      const transport = new SSEServerTransport('/message', res);

      // Handle connection close
      res.on('close', () => {
        console.error('🔌 Standard MCP SSE connection closed');
      });

      try {
        await this.server.connect(transport);
        console.error('✅ Standard MCP client connected via SSE');
      } catch (error) {
        console.error('❌ Failed to connect MCP client:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: String(error) });
        }
      }
    });

    // Standard MCP message endpoint (POST for client messages)
    app.post('/message', async (req: Request, res: Response) => {
      // This endpoint is used by SSEServerTransport for bidirectional communication
      res.status(200).json({ ok: true });
    });

    // ============================================================================
    // LEGACY CUSTOM ENDPOINTS (for existing client/agent)
    // ============================================================================

    // MCP initialize endpoint
    app.post('/mcp/initialize', async (req: Request, res: Response) => {
      try {
        const clientInfo = req.body;
        const agentId = clientInfo.clientInfo?.name;

        if (!agentId) {
          res.status(400).json({ error: 'Missing client name' });
          return;
        }

        // Register agent
        const agent = createAgentInfo(
          agentId,
          clientInfo.clientInfo?.type || 'unknown',
          clientInfo.clientInfo?.version || '0.1.0'
        );

        this.context.agents.set(agentId, agent);

        if (!this.context.messageQueues.has(agentId)) {
          this.context.messageQueues.set(agentId, []);
        }

        console.error(`✅ Agent registered via HTTP: ${agentId}`);

        res.json({
          protocolVersion: '2024-11-05',
          capabilities: {
            routing: {
              async_queue: true,
              sse_streaming: true,
            },
            tools: {
              send_message: true,
              list_agents: true,
              get_conversation: true,
            },
          },
          serverInfo: {
            name: 'autoninja-mcp-hub',
            version: '1.0.0',
          },
        });
      } catch (error) {
        console.error('Initialize error:', error);
        res.status(500).json({ error: String(error) });
      }
    });

    // MCP tools/call endpoint
    app.post('/mcp/tools/call', async (req: Request, res: Response) => {
      try {
        const request = req.body;
        const { name, arguments: args } = request.params || {};
        const requestId = request.id;

        let result;
        switch (name) {
          case 'register_agent':
            result = await this.handleRegisterAgent(args as RegisterAgentArgs);
            break;
          case 'send_message':
            result = await this.handleSendMessage(args as SendMessageArgs);
            break;
          case 'list_agents':
            result = await this.handleListAgents();
            break;
          case 'get_conversation':
            result = await this.handleGetConversation(
              args as GetConversationArgs
            );
            break;
          default:
            res.status(400).json({
              jsonrpc: '2.0',
              id: requestId,
              error: {
                code: -32601,
                message: `Unknown tool: ${name}`,
              },
            });
            return;
        }

        res.json({
          jsonrpc: '2.0',
          id: requestId,
          result: result,
        });
      } catch (error) {
        console.error('Tool call error:', error);
        res.status(500).json({
          jsonrpc: '2.0',
          id: req.body?.id,
          error: {
            code: -32000,
            message: String(error),
          },
        });
      }
    });

    // SSE endpoint for receiving messages
    app.get('/mcp/sse/:agentId', (req: Request, res: Response) => {
      const agentId = req.params.agentId;

      console.error(`🔌 SSE connection opened: ${agentId}`);

      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      // Store client connection
      this.context.sseClients.set(agentId, res);

      // Send keepalive every 30 seconds
      const keepaliveInterval = setInterval(() => {
        if (res.writableEnded) {
          clearInterval(keepaliveInterval);
          return;
        }
        res.write(
          `event: keepalive\ndata: ${JSON.stringify({
            timestamp: new Date().toISOString(),
          })}\n\n`
        );
      }, 30000);

      // Handle client disconnect
      req.on('close', () => {
        console.error(`🔌 SSE connection closed: ${agentId}`);
        clearInterval(keepaliveInterval);
        this.context.sseClients.delete(agentId);
      });
    });

    // Health check endpoint
    app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        agents: this.context.agents.size,
        conversations: this.context.conversations.size,
      });
    });

    app.listen(port, () => {
      console.error(
        `🚀 MCP Hub Server running on HTTP: http://localhost:${port}`
      );
      console.error(`\n📡 Standard MCP Endpoints (for Claude Desktop, etc):`);
      console.error(`   - SSE: POST http://localhost:${port}/sse`);
      console.error(`   - Message: POST http://localhost:${port}/message`);
      console.error(`\n📡 Legacy Custom Endpoints (for existing client/agent):`);
      console.error(
        `   - Initialize: POST http://localhost:${port}/mcp/initialize`
      );
      console.error(
        `   - Tools: POST http://localhost:${port}/mcp/tools/call`
      );
      console.error(`   - SSE: GET http://localhost:${port}/mcp/sse/:agentId`);
    });
  }

  getServer(): Server {
    return this.server;
  }
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================
async function main() {
  const hub = new MCPHub();

  // Choose transport based on environment variable or command line arg
  const transport = process.env.TRANSPORT || process.argv[2] || 'http';
  const port = parseInt(process.env.PORT || '8000', 10);

  if (transport === 'stdio') {
    console.error('📡 Using STDIO transport');
    await hub.runStdio();
  } else {
    console.error('📡 Using HTTP transport');
    await hub.runHttp(port);
  }

  // ============================================================================
  // COMMENTED OUT: Alternative stdio transport (for local process communication)
  // ============================================================================
  // To use stdio instead of HTTP:
  // 1. Comment out the above HTTP section
  // 2. Uncomment the lines below:
  //
  // console.error('📡 Using STDIO transport');
  // await hub.runStdio();
  //
  // Or run with: TRANSPORT=stdio npm start
  // ============================================================================
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
