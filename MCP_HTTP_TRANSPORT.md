# MCP HTTP Transport Implementation

The hub now implements proper **Streamable HTTP Transport** as specified in the official MCP SDK.

## Architecture

The hub uses `StreamableHTTPServerTransport` from `@modelcontextprotocol/sdk` which provides:

- ✅ **Session management** with unique session IDs
- ✅ **Event resumability** using Last-Event-ID headers
- ✅ **Bidirectional communication** via POST (requests) and GET (SSE streams)
- ✅ **Proper MCP protocol compliance**

## HTTP Endpoints

### POST `/mcp` - Send Requests

Used for all JSON-RPC requests (initialize, tools/call, tools/list, etc.)

**Initialization (first request):**
```bash
curl -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "my-client",
        "version": "1.0.0"
      }
    }
  }'
```

**Response includes session ID:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": { "tools": {} },
    "serverInfo": {
      "name": "autoninja-mcp-hub",
      "version": "1.0.0"
    }
  }
}
```

**Response headers:**
```
Mcp-Session-Id: abc123...
```

**Subsequent requests (with session ID):**
```bash
curl -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: abc123..." \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'
```

### GET `/mcp` - SSE Stream

Establishes Server-Sent Events stream for receiving notifications and responses.

**Connect to stream:**
```bash
curl -N http://localhost:8000/mcp \
  -H "Mcp-Session-Id: abc123..."
```

**With resumability (reconnect after disconnect):**
```bash
curl -N http://localhost:8000/mcp \
  -H "Mcp-Session-Id: abc123..." \
  -H "Last-Event-ID: 1234567890-42"
```

**SSE Events:**
```
id: 1234567890-1
data: {"jsonrpc":"2.0","id":2,"result":{"tools":[...]}}

id: 1234567890-2
data: {"jsonrpc":"2.0","method":"notifications/message","params":{...}}
```

### DELETE `/mcp` - Terminate Session

Cleanly terminate a session.

```bash
curl -X DELETE http://localhost:8000/mcp \
  -H "Mcp-Session-Id: abc123..."
```

## Session Management

### Session Lifecycle

1. **Initialize**: Client sends POST `/mcp` with initialize request
2. **Server response**: Returns session ID in `Mcp-Session-Id` header
3. **Connect SSE**: Client opens GET `/mcp` with session ID
4. **Exchange messages**: Client sends POST requests, receives SSE events
5. **Terminate**: Client sends DELETE `/mcp` (optional, auto-cleaned on disconnect)

### Event Resumability

The hub stores recent events per session, allowing clients to reconnect:

```javascript
// Client disconnects at event ID "1234567890-42"
// Client reconnects with:
GET /mcp
Mcp-Session-Id: abc123
Last-Event-ID: 1234567890-42

// Server replays all events after ID "1234567890-42"
```

Events are stored in memory (up to 1000 events per session by default).

## Example: Complete Flow

### 1. Initialize Session

```bash
$ curl -i -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "test", "version": "1.0.0"}
    }
  }'

HTTP/1.1 200 OK
Mcp-Session-Id: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{"jsonrpc":"2.0","id":1,"result":{...}}
```

**Save the session ID**: `550e8400-e29b-41d4-a716-446655440000`

### 2. Connect SSE Stream (in separate terminal)

```bash
$ curl -N http://localhost:8000/mcp \
  -H "Mcp-Session-Id: 550e8400-e29b-41d4-a716-446655440000"

# Stream stays open, waiting for events...
```

### 3. List Tools

```bash
$ curl -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'
```

**SSE stream receives:**
```
id: 1699999999-1
data: {"jsonrpc":"2.0","id":2,"result":{"tools":[...]}}
```

### 4. Call a Tool

```bash
$ curl -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "register_agent",
      "arguments": {
        "agent_id": "test_agent",
        "agent_type": "tester"
      }
    }
  }'
```

**SSE stream receives:**
```
id: 1699999999-2
data: {"jsonrpc":"2.0","id":3,"result":{"content":[{"type":"text","text":"..."}]}}
```

### 5. Terminate Session

```bash
$ curl -X DELETE http://localhost:8000/mcp \
  -H "Mcp-Session-Id: 550e8400-e29b-41d4-a716-446655440000"

Session terminated
```

## Differences from Previous Implementation

### ❌ Old (Incorrect) Implementation

```
POST /mcp/initialize  # Custom endpoint
POST /mcp/tools/call  # Custom endpoint
GET /mcp/sse/:agentId  # Agent-specific SSE
```

### ✅ New (Correct) Implementation

```
POST /mcp            # All requests
GET /mcp             # SSE stream (session-based)
DELETE /mcp          # Session termination
```

The new implementation:
- Uses standard MCP endpoints
- Session-based (not agent-based)
- Supports resumability
- Compatible with official MCP clients
- Follows the SDK's StreamableHTTPServerTransport pattern

## Client Library Example

### JavaScript/TypeScript

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const transport = new StreamableHTTPClientTransport({
  url: 'http://localhost:8000/mcp'
});

const client = new Client({
  name: 'my-client',
  version: '1.0.0'
}, {
  capabilities: {}
});

await client.connect(transport);

// List tools
const tools = await client.listTools();

// Call a tool
const result = await client.callTool({
  name: 'register_agent',
  arguments: {
    agent_id: 'my_agent',
    agent_type: 'custom'
  }
});
```

### Python (conceptual)

```python
import httpx
import json

class MCPClient:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session_id = None

    async def initialize(self):
        response = await httpx.post(f"{self.base_url}/mcp", json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "python-client", "version": "1.0.0"}
            }
        })
        self.session_id = response.headers.get("Mcp-Session-Id")
        return response.json()

    async def call_tool(self, name, arguments):
        response = await httpx.post(f"{self.base_url}/mcp",
            json={
                "jsonrpc": "2.0",
                "id": 2,
                "method": "tools/call",
                "params": {"name": name, "arguments": arguments}
            },
            headers={"Mcp-Session-Id": self.session_id}
        )
        return response.json()
```

## Benefits

### 1. **Standard Compliance**
Uses official MCP SDK transport, compatible with any MCP client.

### 2. **Resumability**
Clients can reconnect and resume from last received event.

### 3. **Session Isolation**
Each client session is independent with its own event stream.

### 4. **Scalability**
Stateless sessions can be distributed across multiple hub instances.

### 5. **Debugging**
Standard endpoints work with curl, Postman, and other HTTP tools.

## Monitoring

### Check Active Sessions

```bash
curl http://localhost:8000/health

{
  "status": "healthy",
  "agents": 2,
  "conversations": 5,
  "sessions": 3
}
```

### View Logs

```bash
curl http://localhost:8000/logs/stats

{
  "totalLogs": 150,
  "byLevel": {"INFO": 120, "DEBUG": 20, "ERROR": 10},
  "byEventType": {...},
  "uptime": 123456
}
```

## Next Steps

- ✅ HTTP transport implemented with StreamableHTTPServerTransport
- ✅ stdio transport for Claude CLI (unchanged)
- ✅ Session management and resumability
- ✅ Centralized logging for all transports
- 🔜 Build MCP client library for custom agents
- 🔜 Add authentication/authorization layer
- 🔜 WebSocket transport (future)

---

**The hub is now fully MCP-compliant with proper HTTP transport!** 🚀
