# MCP Bridge - Bidirectional Agent Communication

## Overview

The MCP Bridge enables bidirectional communication between two agents using the Model Context Protocol (MCP). It acts as a relay server that maintains separate MCP server instances for each agent and routes messages between them.

## Architecture

```
Agent1 <-> [MCP Server 1 <-> Bridge Router <-> MCP Server 2] <-> Agent2
```

### Key Components

1. **McpBridge**: Core bridge logic that manages sessions and message routing
2. **McpBridgeServer**: HTTP server wrapper that provides REST endpoints for bridge management
3. **BridgeSession**: Session management for agent pairs

## Features

- ✅ Bidirectional message routing between two agents
- ✅ Session-based agent pairing
- ✅ HTTP/REST API for bridge management
- ✅ StreamableHTTP transport support
- ✅ Built on official `@modelcontextprotocol/sdk`
- ✅ Query tools for agents to discover each other's capabilities
- ✅ Session info tools for runtime introspection

## Installation

The bridge is part of the `atlantis-core-mcp` package:

```bash
npm install
npm run build
```

## Quick Start

### 1. Start the Bridge Server

```typescript
import { startBridgeServer } from './src/infrastructure/mcp/mcp-bridge-server.js';

const server = await startBridgeServer({
  port: 3100,
  host: 'localhost',
  cors: true
});
```

Or via command line (after building):

```bash
node dist/infrastructure/mcp/mcp-bridge-server.js
```

### 2. Create a Bridge Session

```bash
curl -X POST http://localhost:3100/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "agent1Id": "research-agent",
    "agent2Id": "writing-agent",
    "metadata": {
      "purpose": "collaborative-writing"
    }
  }'
```

Response:
```json
{
  "sessionId": "uuid-here",
  "agent1Endpoint": "/bridge/agent1/uuid-here",
  "agent2Endpoint": "/bridge/agent2/uuid-here",
  "createdAt": "2025-11-03T..."
}
```

### 3. Connect Agents to the Bridge

Each agent connects to their respective endpoint using MCP client:

**Agent 1:**
```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const transport = new StreamableHTTPClientTransport(
  new URL('http://localhost:3100/bridge/agent1/uuid-here')
);

const client = new Client({
  name: 'research-agent',
  version: '1.0.0'
});

await client.connect(transport);
```

**Agent 2:**
```typescript
const transport2 = new StreamableHTTPClientTransport(
  new URL('http://localhost:3100/bridge/agent2/uuid-here')
);

const client2 = new Client({
  name: 'writing-agent',
  version: '1.0.0'
});

await client2.connect(transport2);
```

### 4. Send Messages Between Agents

**From Agent 1 to Agent 2:**
```typescript
// Agent 1 calls the bridge tool
const result = await client.request({
  method: 'tools/call',
  params: {
    name: 'send_to_agent2',
    arguments: {
      message: 'Hello Agent 2, I found some research data!',
      metadata: {
        dataType: 'research',
        confidence: 0.95
      }
    }
  }
});
```

**From Agent 2 to Agent 1:**
```typescript
// Agent 2 responds back
const result = await client2.request({
  method: 'tools/call',
  params: {
    name: 'send_to_agent1',
    arguments: {
      message: 'Thanks! I will incorporate it into the document.',
      metadata: {
        status: 'acknowledged'
      }
    }
  }
});
```

## Available Tools

Each agent automatically gets access to bridge-specific tools:

### For Agent 1:
- **`send_to_agent2`**: Send a message to agent2
- **`query_agent2`**: Query agent2's capabilities and available tools
- **`get_session_info`**: Get information about the current bridge session

### For Agent 2:
- **`send_to_agent1`**: Send a message to agent1
- **`query_agent1`**: Query agent1's capabilities and available tools
- **`get_session_info`**: Get information about the current bridge session

## REST API Endpoints

### Health Check
```
GET /health
```

Returns bridge status and active session count.

### Create Session
```
POST /sessions
Body: {
  "agent1Id": "string",
  "agent2Id": "string",
  "metadata": {} // optional
}
```

Creates a new bridge session for two agents.

### Get Session Info
```
GET /sessions/:sessionId
```

Retrieves information about a specific session.

### List All Sessions
```
GET /sessions
```

Lists all active sessions.

### Delete Session
```
DELETE /sessions/:sessionId
```

Closes and removes a session.

### MCP Endpoints
```
POST /bridge/agent1/:sessionId
POST /bridge/agent2/:sessionId
```

MCP communication endpoints for agents (used by MCP clients automatically).

## Usage Examples

### Example 1: Research and Writing Collaboration

```typescript
import { McpBridgeServer } from './src/infrastructure/mcp/mcp-bridge-server.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

// Start bridge server
const bridgeServer = new McpBridgeServer({ port: 3100 });
await bridgeServer.start();

// Create session
const session = bridgeServer.getBridge().createSession(
  'researcher',
  'writer',
  { project: 'article-generation' }
);

// Connect researcher agent
const researcherTransport = new StreamableHTTPClientTransport(
  new URL(`http://localhost:3100/bridge/agent1/${session.sessionId}`)
);
const researcher = new Client({ name: 'researcher', version: '1.0.0' });
await researcher.connect(researcherTransport);

// Connect writer agent
const writerTransport = new StreamableHTTPClientTransport(
  new URL(`http://localhost:3100/bridge/agent2/${session.sessionId}`)
);
const writer = new Client({ name: 'writer', version: '1.0.0' });
await writer.connect(writerTransport);

// Researcher sends data to writer
await researcher.request({
  method: 'tools/call',
  params: {
    name: 'send_to_agent2',
    arguments: {
      message: JSON.stringify({
        topic: 'AI Safety',
        findings: ['Finding 1', 'Finding 2'],
        sources: ['Source A', 'Source B']
      })
    }
  }
});

// Writer acknowledges and requests more details
await writer.request({
  method: 'tools/call',
  params: {
    name: 'send_to_agent1',
    arguments: {
      message: 'Received. Please provide more context on Finding 1.'
    }
  }
});
```

### Example 2: Query Agent Capabilities

```typescript
// Agent 1 discovers what tools Agent 2 has
const capabilities = await agent1Client.request({
  method: 'tools/call',
  params: {
    name: 'query_agent2',
    arguments: {
      query: 'What can you do?',
      context: { purpose: 'capability-discovery' }
    }
  }
});

console.log('Agent 2 tools:', capabilities.structuredContent.availableTools);
```

### Example 3: Session Introspection

```typescript
// Get current session information
const sessionInfo = await agent1Client.request({
  method: 'tools/call',
  params: {
    name: 'get_session_info',
    arguments: {}
  }
});

console.log('Session ID:', sessionInfo.structuredContent.sessionId);
console.log('Partner:', sessionInfo.structuredContent.agent2Id);
console.log('Created:', sessionInfo.structuredContent.createdAt);
```

## Configuration

### Bridge Server Configuration

```typescript
interface BridgeServerConfig {
  port?: number;          // Default: 3100
  host?: string;          // Default: 'localhost'
  cors?: boolean;         // Default: true
}
```

### Environment Variables

```bash
# Bridge server port
BRIDGE_PORT=3100

# Bridge server host
BRIDGE_HOST=localhost

# Enable debug logging
DEBUG=bridge:*
```

## Advanced Usage

### Custom Transport Handling

```typescript
import { McpBridge } from './src/infrastructure/mcp/mcp-bridge.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

const bridge = new McpBridge('my-custom-bridge');
const session = bridge.createSession('agent1', 'agent2');

// Use your custom transport implementation
const customTransport: Transport = new MyCustomTransport();
await bridge.connectAgent1(customTransport, session.sessionId);
```

### Accessing Underlying MCP Servers

```typescript
const { agent1, agent2 } = bridge.getServers();

// Register additional tools on agent1's server
agent1.registerTool('custom_tool', {
  description: 'Custom tool for agent1',
  inputSchema: { param: z.string() }
}, async ({ param }) => {
  return {
    content: [{ type: 'text', text: `Processed: ${param}` }]
  };
});
```

### Session Lifecycle Management

```typescript
// Monitor sessions
setInterval(() => {
  const sessions = bridge.getActiveSessions();
  console.log(`Active sessions: ${sessions.length}`);

  // Clean up idle sessions
  const now = Date.now();
  for (const session of sessions) {
    const idleTime = now - session.lastActivity.getTime();
    if (idleTime > 30 * 60 * 1000) { // 30 minutes
      bridge.closeSession(session.sessionId);
      console.log(`Closed idle session: ${session.sessionId}`);
    }
  }
}, 60000); // Check every minute
```

## Testing

Run the test suite:

```bash
npm test -- src/infrastructure/mcp/__tests__/mcp-bridge.test.ts
```

## Limitations

1. **Two-Agent Limit**: Each bridge session supports exactly two agents. For multi-agent communication, create multiple bridge instances or sessions.

2. **Message Delivery**: Messages are delivered via MCP logging notifications. For critical workflows, implement acknowledgment patterns in your agents.

3. **Session Persistence**: Sessions are in-memory only. If the bridge server restarts, all sessions are lost.

4. **Transport Compatibility**: Currently supports StreamableHTTP transport. SSE and WebSocket support can be added.

## Troubleshooting

### Agent Can't Connect

- Verify the bridge server is running: `curl http://localhost:3100/health`
- Check that the session exists: `curl http://localhost:3100/sessions/SESSION_ID`
- Ensure the correct endpoint URL is used

### Messages Not Routing

- Verify both agents are connected to the same session
- Check server logs for routing errors
- Use `get_session_info` tool to verify session state

### Performance Issues

- Monitor active session count: `curl http://localhost:3100/sessions`
- Implement session cleanup for idle connections
- Consider horizontal scaling with multiple bridge instances

## Integration with Atlantis Core

The MCP Bridge integrates seamlessly with the Atlantis Core MCP infrastructure:

```typescript
import { McpBridgeServer } from './infrastructure/mcp/mcp-bridge-server.js';
import { AtlantisMcpServer } from './infrastructure/mcp/mcp-server.js';

// Start Atlantis Core MCP server
const coreServer = new AtlantisMcpServer();
await coreServer.startHttp(3000);

// Start Bridge server on different port
const bridgeServer = new McpBridgeServer({ port: 3100 });
await bridgeServer.start();

// Now modules can communicate through the core server
// AND agents can communicate through the bridge
```

## Future Enhancements

- [ ] Multi-agent bridge support (3+ agents)
- [ ] Persistent session storage (Redis/database)
- [ ] WebSocket transport support
- [ ] Message history and replay
- [ ] Authentication and authorization
- [ ] Rate limiting and quotas
- [ ] Metrics and monitoring dashboard
- [ ] Agent discovery service

## Contributing

Contributions are welcome! Please ensure:
1. All tests pass: `npm test`
2. Code follows TypeScript strict mode
3. Documentation is updated
4. New features include tests

## License

MIT License - Part of the Atlantis Core MCP project
