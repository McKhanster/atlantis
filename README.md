# Atlantis - MCP Hub for Agent Communication

A feature-rich, MCP-compliant hub for agent-to-agent communication with centralized logging.

## Features

✅ **MCP Compliant** - Works with Claude CLI and custom agents
✅ **Dual Transport** - stdio (Claude CLI) and HTTP (custom agents)
✅ **Centralized Logging** - Logs all interactions to file, console, and memory
✅ **Session Management** - Proper session handling with resumability
✅ **Agent Tools** - Register agents, send messages, track conversations

## Quick Start

### For Claude CLI Users

**1. Build the hub:**
```bash
cd src/infrastructure/server
npm install && npm run build
```

**2. Configure Claude CLI (`~/.config/claude/config.json`):**
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

**3. Restart Claude** - The hub will start automatically!

### For Custom Agents

**1. Start the hub:**
```bash
./scripts/start-hub-system.sh hub
```

**2. Connect your agent:**
```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const transport = new StreamableHTTPClientTransport({
  url: 'http://localhost:8000/mcp'
});

const client = new Client(
  { name: 'my-agent', version: '1.0.0' },
  { capabilities: {} }
);

await client.connect(transport);
```

## Available Tools

| Tool | Description |
|------|-------------|
| `register_agent` | Register an agent with the hub |
| `send_message` | Send message between agents |
| `list_agents` | List all connected agents |
| `get_conversation` | Get conversation history |

## Documentation

### Getting Started
- **[HTTP_QUICKSTART.md](HTTP_QUICKSTART.md)** - How to start the server and connect clients
- **[README_HTTP.md](README_HTTP.md)** - Connection examples in all languages
- **[QUICKSTART_HUB.md](QUICKSTART_HUB.md)** - Complete system overview

### For Claude CLI
- **[CLAUDE_CLI_SETUP.md](CLAUDE_CLI_SETUP.md)** - Claude CLI configuration guide
- **[mcp-config-example.json](mcp-config-example.json)** - Example config file

### Technical Details
- **[MCP_HTTP_TRANSPORT.md](MCP_HTTP_TRANSPORT.md)** - HTTP transport specification
- **[HUB_README.md](HUB_README.md)** - Complete hub documentation

## Architecture

```
┌─────────────────┐
│   Claude CLI    │ (stdio transport)
└────────┬────────┘
         │
    ┌────▼─────┐         ┌──────────────┐
    │ MCP Hub  │◄────────┤ Custom Agent │ (HTTP transport)
    │          │         └──────────────┘
    │ • Logging│
    │ • Routing│         ┌──────────────┐
    │ • Session│◄────────┤ Custom Agent │ (HTTP transport)
    └──────────┘         └──────────────┘
```

## Development

```bash
# Build everything
cd src/infrastructure/server && npm run build
cd client/agent && npm run build
cd client/client && npm run build

# Start the system
./scripts/start-hub-system.sh all

# Run just the hub
./scripts/start-hub-system.sh hub

# Stop everything
./scripts/start-hub-system.sh stop
```

## Testing

```bash
# Check hub health
curl http://localhost:8000/health

# View logs
curl http://localhost:8000/logs/stats

# Test with curl
curl -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize",...}'
```

## Requirements

- Node.js 18+
- npm 9+
- TypeScript 5+

## License

MIT