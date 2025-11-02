# MCP-to-MCP Bridge Implementation Plan

## Overview
Implementation of a singleton MCP-to-MCP bridge system that enables direct client-to-client communication following the established infrastructure patterns in Atlantis Core.

## User Sequence Requirements
1. **Client1 Discovery**: Client1 checks `list_bridge` tool - returns empty (no active bridges)
2. **Bridge Creation**: Client1 uses `connect_bridge` tool with "create" parameter - singleton bridge opens
3. **Client2 Discovery**: Client2 uses `list_bridge` and sees Client1 is connected
4. **Client2 Connection**: Client2 uses `connect_bridge` with Client1's agent ID - both clients now connected

## Architecture Analysis

### MCP Protocol Foundation
- **JSON-RPC 2.0**: All messages follow JSON-RPC specification with requests, responses, notifications
- **Lifecycle Management**: Initialize → Operation → Shutdown phases with capability negotiation
- **Bidirectional Communication**: Both clients and servers can send requests/notifications
- **Transport Agnostic**: Can work over stdio, HTTP, or custom transports

### Existing Singleton Pattern
Based on infrastructure analysis:
- `CentralLogger.getInstance()`: Singleton HTTP logger on port 3002
- `HealthCheckTool.getInstance()`: Singleton health check tool
- `HttpModuleRegistry.getInstance()`: Singleton registry on port 3001

## Implementation Components

### 1. HTTP Streamable MCP Bridge Server (`src/infrastructure/bridge/mcp2mcp-bridge-server.ts`)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { randomUUID } from 'crypto';

interface BridgeConnection {
  agentId: string;
  sessionId: string;
  clientName: string;
  transport: StreamableHTTPServerTransport;
  lastSeen: Date;
}

class MCP2MCPBridgeServer {
  private static instance: MCP2MCPBridgeServer | null = null;
  private connections: Map<string, BridgeConnection> = new Map();
  private transports: Map<string, StreamableHTTPServerTransport> = new Map();
  private mcpServer: McpServer;
  private app: express.Application;
  private httpServer: any;
  
  static getInstance(): MCP2MCPBridgeServer {
    if (!this.instance) {
      this.instance = new MCP2MCPBridgeServer();
    }
    return this.instance;
  }
  
  private constructor() {
    this.mcpServer = new McpServer({
      name: 'mcp2mcp-bridge',
      version: '1.0.0'
    });
    this.setupMCPTools();
    this.setupExpressServer();
  }
  
  private setupMCPTools(): void {
    // Register bridge management tools
    this.mcpServer.registerTool(
      'list_bridge',
      {
        title: 'List Bridge Connections',
        description: 'List all connected bridge clients',
        inputSchema: {},
        outputSchema: { connections: z.array(z.object({
          agentId: z.string(),
          clientName: z.string(),
          lastSeen: z.string()
        }))}
      },
      async () => this.handleListBridge()
    );
    
    this.mcpServer.registerTool(
      'connect_bridge',
      {
        title: 'Connect to Bridge',
        description: 'Create or connect to bridge',
        inputSchema: {
          action: z.enum(['create', 'connect']),
          targetId: z.string().optional(),
          clientName: z.string().optional()
        },
        outputSchema: {
          agentId: z.string(),
          status: z.string(),
          connections: z.array(z.any())
        }
      },
      async (params, context) => this.handleConnectBridge(params, context)
    );
    
    this.mcpServer.registerTool(
      'send_bridge_message',
      {
        title: 'Send Bridge Message',
        description: 'Send message to another bridge client',
        inputSchema: {
          targetId: z.string(),
          message: z.any()
        },
        outputSchema: { success: z.boolean(), delivered: z.boolean() }
      },
      async (params, context) => this.handleSendMessage(params, context)
    );
  }
  
  private setupExpressServer(): void {
    this.app = express();
    this.app.use(express.json());
    
    // Main MCP endpoint
    this.app.post('/mcp', async (req, res) => {
      await this.handleMCPRequest(req, res);
    });
    
    // SSE endpoint for notifications
    this.app.get('/mcp', async (req, res) => {
      await this.handleSSEConnection(req, res);
    });
    
    // Session cleanup endpoint
    this.app.delete('/mcp', async (req, res) => {
      await this.handleSessionCleanup(req, res);
    });
  }
  
  private async handleMCPRequest(req: express.Request, res: express.Response): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;
    
    if (sessionId && this.transports.has(sessionId)) {
      // Reuse existing transport
      transport = this.transports.get(sessionId)!;
    } else {
      // Create new transport with session management
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          this.transports.set(newSessionId, transport);
          // Auto-register connection on initialization
          const agentId = randomUUID();
          this.connections.set(newSessionId, {
            agentId,
            sessionId: newSessionId,
            clientName: 'Unknown Client',
            transport,
            lastSeen: new Date()
          });
        }
      });
      
      transport.onclose = () => {
        if (transport.sessionId) {
          this.removeConnection(transport.sessionId);
        }
      };
      
      await this.mcpServer.connect(transport);
    }
    
    await transport.handleRequest(req, res, req.body);
  }
  
  private async handleSSEConnection(req: express.Request, res: express.Response): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string;
    if (!sessionId || !this.transports.has(sessionId)) {
      res.status(400).send('Invalid session ID');
      return;
    }
    
    const transport = this.transports.get(sessionId)!;
    await transport.handleRequest(req, res);
  }
  
  private async handleSessionCleanup(req: express.Request, res: express.Response): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string;
    if (sessionId) {
      this.removeConnection(sessionId);
    }
    res.status(200).send('Session cleaned up');
  }
}
```

### 2. StreamableHTTPServerTransport Integration Details

**Key Implementation Points:**

1. **Session Management**:
   ```typescript
   const transport = new StreamableHTTPServerTransport({
     sessionIdGenerator: () => randomUUID(),
     onsessioninitialized: (sessionId) => {
       // Track session and create bridge connection
       this.transports.set(sessionId, transport);
       this.connections.set(sessionId, {
         agentId: randomUUID(),
         sessionId,
         clientName: 'Client',
         transport,
         lastSeen: new Date()
       });
     }
   });
   ```

2. **HTTP Endpoint Handling**:
   ```typescript
   // POST /mcp - Handle MCP requests
   app.post('/mcp', async (req, res) => {
     const sessionId = req.headers['mcp-session-id'];
     const transport = this.getOrCreateTransport(sessionId);
     await transport.handleRequest(req, res, req.body);
   });
   
   // GET /mcp - SSE stream for notifications
   app.get('/mcp', async (req, res) => {
     const sessionId = req.headers['mcp-session-id'];
     const transport = this.transports.get(sessionId);
     await transport.handleRequest(req, res); // Opens SSE stream
   });
   ```

3. **Real-time Message Delivery**:
   ```typescript
   async routeMessage(fromSessionId: string, toAgentId: string, message: any): Promise<void> {
     const targetConnection = this.findConnectionByAgentId(toAgentId);
     if (targetConnection?.transport) {
       // Send notification via SSE stream
       await targetConnection.transport.sendNotification({
         method: 'notifications/bridge/message',
         params: {
           from: fromSessionId,
           message: message,
           timestamp: new Date().toISOString()
         }
       });
     }
   }
   ```

4. **Connection Lifecycle**:
   ```typescript
   transport.onclose = () => {
     if (transport.sessionId) {
       this.removeConnection(transport.sessionId);
       this.transports.delete(transport.sessionId);
       // Notify other clients about disconnection
       this.broadcastConnectionUpdate();
     }
   };
   ```

### 3. Bridge Tool Implementation (HTTP Client)

```typescript
class MCP2MCPBridgeTool extends BaseTool {
  private static instance: MCP2MCPBridgeTool | null = null;
  
  static getInstance(): MCP2MCPBridgeTool;
  
  // Tool methods
  async list_bridge(): Promise<ToolResult>;
  async connect_bridge(params: {action: 'create' | string}): Promise<ToolResult>;
  async send_message(params: {targetId: string, message: any}): Promise<ToolResult>;
  async disconnect_bridge(): Promise<ToolResult>;
}
```

### 3. HTTP Bridge Integration

```typescript
class MCP2MCPBridgeTool extends BaseTool {
  private static instance: MCP2MCPBridgeTool | null = null;
  private bridgeServerUrl = 'http://localhost:3003/mcp';
  
  static getInstance(): MCP2MCPBridgeTool {
    if (!this.instance) {
      this.instance = new MCP2MCPBridgeTool();
    }
    return this.instance;
  }
  
  async list_bridge(): Promise<ToolResult> {
    // Make HTTP request to bridge server
    const response = await fetch(this.bridgeServerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: randomUUID(),
        method: 'tools/call',
        params: {
          name: 'list_bridge',
          arguments: {}
        }
      })
    });
    
    const result = await response.json();
    return {
      content: [{ type: 'text', text: JSON.stringify(result.result) }],
      structuredContent: result.result
    };
  }
  
  async connect_bridge(params: {action: string, targetId?: string}): Promise<ToolResult> {
    // Similar HTTP request pattern for bridge connection
    const response = await this.makeToolCall('connect_bridge', params);
    return this.formatToolResult(response);
  }
  
  private async makeToolCall(toolName: string, args: any): Promise<any> {
    const response = await fetch(this.bridgeServerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: randomUUID(),
        method: 'tools/call',
        params: { name: toolName, arguments: args }
      })
    });
    return await response.json();
  }
}
```

**Bridge Server Architecture** (Port 3003):
- **McpServer**: Handles MCP protocol with bridge-specific tools
- **StreamableHTTPServerTransport**: Manages HTTP/SSE connections per session
- **Express Routes**: POST for requests, GET for SSE, DELETE for cleanup
- **Session Tracking**: Maps `Mcp-Session-Id` to transport instances
- **Real-time Notifications**: SSE streams deliver messages instantly

## Detailed Implementation Steps

### Phase 1: Core Bridge Infrastructure

1. **Create Bridge Directory Structure**
   ```bash
   mkdir -p src/infrastructure/bridge
   ```

2. **Implement MCP2MCP Bridge Singleton**
   - Follow existing singleton pattern from CentralLogger
   - Manage connection registry with agent IDs
   - Implement message routing between connections
   - Auto-cleanup when no connections remain

3. **Create Bridge Management Tool**
   - Extend BaseTool following HealthCheckTool pattern
   - Implement `list_bridge` - returns connected agents
   - Implement `connect_bridge` with create/connect logic
   - Implement message passing capabilities

### Phase 2: MCP Server Integration

4. **Update MCP Server**
   - Register MCP2MCPBridgeTool in tool registry
   - Add bridge lifecycle event handlers
   - Implement notification forwarding for bridge messages

5. **Client Connection Management**
   - Track client connections in bridge
   - Generate unique agent IDs per client
   - Handle connection cleanup on disconnect

### Phase 3: Message Protocol

6. **Define Bridge Message Schema**
   ```typescript
   interface BridgeMessage {
     type: 'direct' | 'broadcast';
     from: string;
     to?: string;
     payload: any;
     timestamp: Date;
   }
   ```

7. **Implement Message Routing**
   - Direct client-to-client messaging
   - Message validation and sanitization
   - Error handling for offline clients

### Phase 4: Testing & Integration

8. **Add to Function Inventory**
   - Document all new functions in `src/function-inventory.md`
   - Include bridge lifecycle and message routing

9. **Type Checking & Error Handling**
   - Run `npm run type-check` after each file
   - Implement comprehensive error handling
   - Add Zod schemas for message validation

## Sequence Flow Implementation

### 1. Client1 Discovery (Empty State)
```typescript
// list_bridge returns empty array
{
  "connections": [],
  "bridgeActive": false
}
```

### 2. Client1 Bridge Creation
```typescript
// connect_bridge with "create" parameter
{
  "action": "create",
  "agentId": "generated-uuid",
  "status": "bridge_created",
  "connections": [{"agentId": "client1-id", "clientName": "Client1"}]
}
```

### 3. Client2 Discovery (Active Bridge)
```typescript
// list_bridge shows Client1
{
  "connections": [
    {"agentId": "client1-id", "clientName": "Client1", "lastSeen": "2024-01-01T00:00:00Z"}
  ],
  "bridgeActive": true
}
```

### 4. Client2 Connection
```typescript
// connect_bridge with Client1's agent ID
{
  "action": "connect",
  "targetId": "client1-id",
  "agentId": "client2-id", 
  "status": "connected",
  "connections": [
    {"agentId": "client1-id", "clientName": "Client1"},
    {"agentId": "client2-id", "clientName": "Client2"}
  ]
}
```

## Technical Considerations

### HTTP Streamable Benefits
- **Persistent Server**: Single HTTP server instance (port 3003)
- **Session Management**: Built-in `Mcp-Session-Id` tracking
- **Real-time Messaging**: SSE streams for instant notifications
- **Cross-Process**: Works across different MCP client processes

### Message Delivery
- **SSE Notifications**: Real-time delivery via Server-Sent Events
- **Session Routing**: Messages routed by session ID and agent ID
- **Connection Persistence**: SSE streams maintain open connections
- **Fallback Handling**: Graceful handling of disconnected clients

### Error Handling
- Connection timeout handling
- Invalid agent ID validation
- Bridge capacity limits (if needed)

### Security
- Agent ID validation
- Message sanitization
- Rate limiting (future enhancement)

## Integration Points

### Existing Infrastructure
- Follows singleton pattern from CentralLogger/HealthCheckTool
- Uses BaseTool extension pattern
- Integrates with MCP server tool registry

### MCP Protocol Compliance
- All messages follow JSON-RPC 2.0 format
- Proper error codes and responses
- Notification system for real-time updates

### Type Safety
- Full TypeScript implementation
- Zod schema validation
- Comprehensive error types

## Success Criteria

1. **Sequence Compliance**: Exact implementation of user-specified 4-step sequence
2. **Singleton Pattern**: Follows established infrastructure patterns
3. **MCP Protocol**: Full compliance with MCP specification
4. **Type Safety**: Passes `npm run type-check` without errors
5. **Integration**: Seamless integration with existing MCP server
6. **Documentation**: Complete function inventory updates

## Future Enhancements

- Message persistence/history
- Bridge authentication/authorization  
- Multi-bridge support (separate bridge instances)
- Message encryption for sensitive data
- Bridge analytics and monitoring