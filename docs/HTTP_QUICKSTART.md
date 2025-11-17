# HTTP Transport Quick Start

## How to Start the HTTP Server

### Option 1: Using the Startup Script
```bash
cd /home/user/atlantis
./scripts/start-hub-system.sh hub
```

The server will start on `http://localhost:8000`

### Option 2: Manual Start
```bash
cd /home/user/atlantis/src/infrastructure/server
npm run build  # Build first (if not already built)
npm start      # Starts on port 8000
```

### Option 3: Custom Port
```bash
cd /home/user/atlantis/src/infrastructure/server
PORT=9000 npm start  # Run on port 9000 instead
```

### Verify It's Running
```bash
curl http://localhost:8000/health

# Should return:
# {"status":"healthy","agents":0,"conversations":0,"sessions":0}
```

## How to Connect Clients

### JavaScript/TypeScript Client

**Install the MCP SDK:**
```bash
npm install @modelcontextprotocol/sdk
```

**Connect to the hub:**
```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

// Create transport pointing to your hub
const transport = new StreamableHTTPClientTransport({
  url: 'http://localhost:8000/mcp'
});

// Create client
const client = new Client(
  {
    name: 'my-agent',
    version: '1.0.0'
  },
  {
    capabilities: {}
  }
);

// Connect
await client.connect(transport);

// Now you can use it
const tools = await client.listTools();
console.log('Available tools:', tools);

// Call a tool
const result = await client.callTool({
  name: 'register_agent',
  arguments: {
    agent_id: 'my_custom_agent',
    agent_type: 'worker'
  }
});
```

### Python Client (Using Requests)

```python
import requests
import json

class HubClient:
    def __init__(self, base_url='http://localhost:8000'):
        self.base_url = base_url
        self.session_id = None

    def initialize(self):
        """Initialize connection and get session ID"""
        response = requests.post(
            f'{self.base_url}/mcp',
            json={
                'jsonrpc': '2.0',
                'id': 1,
                'method': 'initialize',
                'params': {
                    'protocolVersion': '2024-11-05',
                    'capabilities': {},
                    'clientInfo': {
                        'name': 'python-client',
                        'version': '1.0.0'
                    }
                }
            },
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/event-stream'
            }
        )

        # Get session ID from response header
        self.session_id = response.headers.get('mcp-session-id')
        print(f'Connected! Session ID: {self.session_id}')
        return response.json()

    def call_tool(self, name, arguments):
        """Call a tool on the hub"""
        if not self.session_id:
            raise Exception('Not initialized. Call initialize() first.')

        response = requests.post(
            f'{self.base_url}/mcp',
            json={
                'jsonrpc': '2.0',
                'id': 2,
                'method': 'tools/call',
                'params': {
                    'name': name,
                    'arguments': arguments
                }
            },
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/event-stream',
                'Mcp-Session-Id': self.session_id
            }
        )
        return response.json()

# Usage
client = HubClient('http://localhost:8000')
client.initialize()

result = client.call_tool('register_agent', {
    'agent_id': 'python_agent',
    'agent_type': 'worker'
})
print(result)
```

### cURL (For Testing)

**Initialize:**
```bash
# Save the session ID from response header
curl -i -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "curl-client", "version": "1.0.0"}
    }
  }'

# Look for this in response headers:
# mcp-session-id: abc123...
```

**Call a tool (using session ID):**
```bash
SESSION_ID="abc123..."  # Replace with your session ID

curl -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "list_agents",
      "arguments": {}
    }
  }'
```

## Configuration Summary

### stdio vs HTTP Transport

| Aspect | stdio (Claude CLI) | HTTP (Custom Agents) |
|--------|-------------------|---------------------|
| **How to start** | Auto-started by Claude | Manually start server first |
| **Config** | `command` in Claude config | URL in client code |
| **Who uses it** | Claude CLI/Desktop only | Any HTTP client |
| **Connection** | Spawns new process | Connects to running server |
| **Multiple clients** | No (1 per process) | Yes (unlimited) |

### When to Use HTTP Transport

Use HTTP transport when:
- ✅ Building custom agents (not Claude)
- ✅ Need multiple clients to same hub
- ✅ Hub runs on different machine
- ✅ Testing with curl/Postman
- ✅ Building web applications

### When to Use stdio Transport

Use stdio transport when:
- ✅ Using Claude CLI/Desktop
- ✅ Single local client only
- ✅ Want maximum performance
- ✅ Prefer automatic startup

## Complete Example: Building a Custom Agent

**1. Start the hub:**
```bash
./scripts/start-hub-system.sh hub
```

**2. Create your agent (agent.js):**
```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

async function main() {
  // Connect to hub
  const transport = new StreamableHTTPClientTransport({
    url: 'http://localhost:8000/mcp'
  });

  const client = new Client(
    { name: 'my-worker-agent', version: '1.0.0' },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log('Connected to hub!');

  // Register ourselves
  await client.callTool({
    name: 'register_agent',
    arguments: {
      agent_id: 'worker_1',
      agent_type: 'worker'
    }
  });
  console.log('Registered as worker_1');

  // List all agents
  const result = await client.callTool({
    name: 'list_agents',
    arguments: {}
  });
  console.log('All agents:', result);
}

main().catch(console.error);
```

**3. Run your agent:**
```bash
node agent.js
```

## Environment Variables

```bash
# Change port
PORT=9000 npm start

# Change log level
LOG_LEVEL=DEBUG npm start

# Force transport mode
TRANSPORT=http npm start   # HTTP mode (default)
TRANSPORT=stdio npm start  # stdio mode
```

## Troubleshooting

### "Connection refused"
Server isn't running. Start it first:
```bash
./scripts/start-hub-system.sh hub
```

### "406 Not Acceptable"
Missing Accept header. Include:
```
Accept: application/json, text/event-stream
```

### "Bad Request: No valid session ID"
Include session ID from initialize response:
```
Mcp-Session-Id: <your-session-id>
```

### Check what's running
```bash
# Check if hub is running
curl http://localhost:8000/health

# Check logs
curl http://localhost:8000/logs/stats
```

## Next Steps

1. **Start hub**: `./scripts/start-hub-system.sh hub`
2. **Test connection**: `curl http://localhost:8000/health`
3. **Build agent**: Use examples above
4. **Check logs**: View `logs/hub.log` or `GET /logs`

---

**That's it! Your HTTP server is ready for custom agents.** 🚀
