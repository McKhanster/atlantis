# How to Connect to the HTTP Hub

## TL;DR

**Start the server:**
```bash
./scripts/start-hub-system.sh hub
```

**Connect your agent (TypeScript/JavaScript):**
```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const transport = new StreamableHTTPClientTransport({
  url: 'http://localhost:8000/mcp'  // That's it! Just the URL
});

const client = new Client(
  { name: 'my-agent', version: '1.0.0' },
  { capabilities: {} }
);

await client.connect(transport);
// Now use client.listTools(), client.callTool(), etc.
```

## Two Ways to Use the Hub

### 1. For Claude CLI/Desktop → Use stdio
**Claude spawns the server automatically.**

**Config file (`~/.config/claude/config.json`):**
```json
{
  "mcpServers": {
    "hub": {
      "command": "node",
      "args": ["/path/to/atlantis/src/infrastructure/server/dist/server.js"],
      "env": {"TRANSPORT": "stdio"}
    }
  }
}
```

Claude will:
- Start the hub when it launches
- Connect via stdio (stdin/stdout)
- Stop the hub when it exits

### 2. For Custom Agents → Use HTTP
**You start the server, agents connect to it.**

**Step 1: Start the hub**
```bash
cd /home/user/atlantis
./scripts/start-hub-system.sh hub
```

**Step 2: Connect your agent**
```typescript
const transport = new StreamableHTTPClientTransport({
  url: 'http://localhost:8000/mcp'
});
```

## Connection Configuration Examples

### TypeScript/JavaScript (Recommended)

**Using official MCP SDK:**
```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const transport = new StreamableHTTPClientTransport({
  url: 'http://localhost:8000/mcp'
});

const client = new Client(
  {
    name: 'my-agent',
    version: '1.0.0'
  },
  {
    capabilities: {}
  }
);

await client.connect(transport);

// Use the client
const tools = await client.listTools();
const result = await client.callTool({
  name: 'register_agent',
  arguments: { agent_id: 'test', agent_type: 'worker' }
});
```

### Python (Manual HTTP)

```python
import requests

class HubClient:
    def __init__(self, base_url='http://localhost:8000'):
        self.base_url = base_url
        self.session_id = None

    def connect(self):
        """Initialize and get session ID"""
        r = requests.post(
            f'{self.base_url}/mcp',
            json={
                'jsonrpc': '2.0',
                'id': 1,
                'method': 'initialize',
                'params': {
                    'protocolVersion': '2024-11-05',
                    'capabilities': {},
                    'clientInfo': {'name': 'python-agent', 'version': '1.0.0'}
                }
            },
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/event-stream'
            }
        )
        self.session_id = r.headers['mcp-session-id']
        return r.json()

    def call_tool(self, name, arguments):
        """Call a tool"""
        return requests.post(
            f'{self.base_url}/mcp',
            json={
                'jsonrpc': '2.0',
                'id': 2,
                'method': 'tools/call',
                'params': {'name': name, 'arguments': arguments}
            },
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/event-stream',
                'Mcp-Session-Id': self.session_id
            }
        ).json()

# Usage
client = HubClient()
client.connect()
result = client.call_tool('list_agents', {})
```

### Go (Manual HTTP)

```go
package main

import (
    "bytes"
    "encoding/json"
    "net/http"
)

type HubClient struct {
    baseURL   string
    sessionID string
}

func NewHubClient(baseURL string) *HubClient {
    return &HubClient{baseURL: baseURL}
}

func (c *HubClient) Connect() error {
    req := map[string]interface{}{
        "jsonrpc": "2.0",
        "id":      1,
        "method":  "initialize",
        "params": map[string]interface{}{
            "protocolVersion": "2024-11-05",
            "capabilities":    map[string]interface{}{},
            "clientInfo": map[string]string{
                "name":    "go-agent",
                "version": "1.0.0",
            },
        },
    }

    body, _ := json.Marshal(req)
    httpReq, _ := http.NewRequest("POST", c.baseURL+"/mcp", bytes.NewBuffer(body))
    httpReq.Header.Set("Content-Type", "application/json")
    httpReq.Header.Set("Accept", "application/json, text/event-stream")

    resp, err := http.DefaultClient.Do(httpReq)
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    c.sessionID = resp.Header.Get("mcp-session-id")
    return nil
}

func (c *HubClient) CallTool(name string, args map[string]interface{}) (map[string]interface{}, error) {
    req := map[string]interface{}{
        "jsonrpc": "2.0",
        "id":      2,
        "method":  "tools/call",
        "params": map[string]interface{}{
            "name":      name,
            "arguments": args,
        },
    }

    body, _ := json.Marshal(req)
    httpReq, _ := http.NewRequest("POST", c.baseURL+"/mcp", bytes.NewBuffer(body))
    httpReq.Header.Set("Content-Type", "application/json")
    httpReq.Header.Set("Accept", "application/json, text/event-stream")
    httpReq.Header.Set("Mcp-Session-Id", c.sessionID)

    resp, err := http.DefaultClient.Do(httpReq)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)
    return result, nil
}

// Usage
func main() {
    client := NewHubClient("http://localhost:8000")
    client.Connect()
    result, _ := client.CallTool("list_agents", map[string]interface{}{})
    // use result...
}
```

## Remote Hub Configuration

### Hub running on another machine

**Start hub on server (e.g., 192.168.1.100):**
```bash
ssh user@192.168.1.100
cd /path/to/atlantis
./scripts/start-hub-system.sh hub
```

**Connect from your machine:**
```typescript
const transport = new StreamableHTTPClientTransport({
  url: 'http://192.168.1.100:8000/mcp'  // Remote hub
});
```

### Hub behind reverse proxy

**nginx config:**
```nginx
location /mcp {
    proxy_pass http://localhost:8000/mcp;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

**Connect:**
```typescript
const transport = new StreamableHTTPClientTransport({
  url: 'https://your-domain.com/mcp'
});
```

## Quick Reference

| Need | Command/Config |
|------|---------------|
| **Start hub** | `./scripts/start-hub-system.sh hub` |
| **Check if running** | `curl http://localhost:8000/health` |
| **Connect (TypeScript)** | `new StreamableHTTPClientTransport({url: 'http://localhost:8000/mcp'})` |
| **Connect (Python)** | `requests.post('http://localhost:8000/mcp', ...)` |
| **Required headers** | `Accept: application/json, text/event-stream` |
| **Session header** | `Mcp-Session-Id: <from-initialize-response>` |
| **Stop hub** | `./scripts/start-hub-system.sh stop` |

## Documentation

- **HTTP_QUICKSTART.md** - Complete examples for all languages
- **MCP_HTTP_TRANSPORT.md** - Technical details and specification
- **CLAUDE_CLI_SETUP.md** - For Claude CLI users (stdio)

---

**Ready to connect!** Pick your language and start coding. 🚀
