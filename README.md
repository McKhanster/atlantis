# Atlantis Core - MCP Hub for Agent Communication

A feature-rich, MCP-compliant hub for agent-to-agent communication with centralized logging and session management.

## Features

✅ **MCP Compliant** - Works with Claude CLI and custom agents
✅ **Dual Transport** - stdio (Claude CLI) and HTTP (custom agents)
✅ **Centralized Logging** - Logs all interactions to file, console, and memory
✅ **Session Management** - Automatic timeout, cleanup, and resumability
✅ **Agent Tools** - Register agents, send messages, track conversations

## Quick Start

### Installation

```bash
npm install
npm run build
```

### Start the Hub

```bash
# Start just the hub server
npm run hub

# Or start complete development system (hub + client + agent)
npm run dev
```

The hub will be available at http://localhost:8000

### For Claude CLI

**Configure `~/.config/claude/config.json`:**
```json
{
  "mcpServers": {
    "atlantis": {
      "command": "node",
      "args": ["/path/to/atlantis/dist/index.js", "stdio"]
    }
  }
}
```

Restart Claude - the hub starts automatically as a subprocess.

### For Custom Agents

**Connect via HTTP:**
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

// Use tools
await client.request({
  method: 'tools/call',
  params: {
    name: 'list_agents',
    arguments: {}
  }
});
```

## Available Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `register_agent` | Register an agent with the hub | `agent_id`, `agent_type`, `version?` |
| `send_message` | Send message between agents | `from_agent`, `to_agent`, `payload`, `conversation_id?`, `reply_to?`, `requires_response?` |
| `list_agents` | List all connected agents | - |
| `get_conversation` | Get conversation history | `conversation_id` |

## API Endpoints

### MCP Protocol
- `POST /mcp` - Initialize session and call tools (requires `Mcp-Session-Id` header for tools)
- `GET /mcp` - Server-Sent Events stream (requires `Mcp-Session-Id` header)
- `DELETE /mcp` - Terminate session (requires `Mcp-Session-Id` header)

### Management
- `GET /health` - Health check with stats (`{status, agents, conversations, sessions, uptime}`)
- `GET /sessions` - List active sessions with metadata
- `GET /logs` - Query logs with filters (`?level=`, `?eventType=`, `?agentId=`, etc.)
- `GET /logs/stats` - Log statistics and aggregated metrics

## NPM Scripts

```bash
# Build & Run
npm run build          # Compile TypeScript
npm start              # Start server (HTTP mode)
npm run start:http     # Start in HTTP mode (default)
npm run start:stdio    # Start in stdio mode
npm run dev            # Start hub + client + agent
npm run hub            # Start hub only

# Development
npm run lint           # Run ESLint
npm run lint:fix       # Auto-fix linting issues
npm run type-check     # TypeScript type checking
npm test               # Run tests
npm run test:watch     # Run tests in watch mode
npm run ci             # Full CI pipeline (lint + type-check + test)
npm run clean          # Remove build artifacts
```

## Architecture

```
┌─────────────────┐
│   Claude CLI    │ (stdio transport)
└────────┬────────┘
         │
    ┌────▼─────┐         ┌──────────────┐
    │ MCP Hub  │◄────────┤ Custom Agent │ (HTTP transport)
    │          │         └──────────────┘
    │ Features │
    │ • Session│         ┌──────────────┐
    │ • Logging│◄────────┤ Custom Agent │ (HTTP transport)
    │ • Routing│         └──────────────┘
    └──────────┘
```

### Session Lifecycle
1. Client sends initialize request to `POST /mcp`
2. Server responds with `Mcp-Session-Id` header
3. Client uses session ID in all requests
4. Session expires after 5 minutes of inactivity
5. Auto-cleanup every 1 minute

## Configuration

### Environment Variables
- `TRANSPORT` - Transport mode (`http` or `stdio`, default: `http`)
- `PORT` - HTTP server port (default: `8000`)

### Session Manager
- **Timeout**: 5 minutes of inactivity
- **Cleanup**: Every 1 minute
- **Heartbeat**: 30 seconds

## Documentation

- **[src/function-inventory.md](src/function-inventory.md)** - Complete API reference and architecture documentation
- **[CLAUDE.md](CLAUDE.md)** - Project instructions for Claude Code
- **[AGENTS.md](AGENTS.md)** - Agent development guidelines

## Requirements

- Node.js 18+
- npm 9+
- TypeScript 5+

## License

MIT
