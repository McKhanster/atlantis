# MCP Hub Server

MCP Hub Server for agent-to-agent communication, built with the official MCP TypeScript SDK.

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Run

```bash
npm start
```

## Development

Watch mode with auto-recompilation:

```bash
npm run watch
```

## Transport Modes

The server supports multiple transport modes for different use cases:

### 1. HTTP/SSE Transport (Default)

For remote connections and standard MCP clients (like Claude Desktop).

**Start the server:**
```bash
npm start
# or explicitly:
TRANSPORT=http npm start
```

**Endpoints:**
- **Standard MCP SSE**: `POST http://localhost:8000/sse`
- **Standard MCP Message**: `POST http://localhost:8000/message`
- Legacy Custom Initialize: `POST http://localhost:8000/mcp/initialize`
- Legacy Custom Tools: `POST http://localhost:8000/mcp/tools/call`
- Legacy Custom SSE: `GET http://localhost:8000/mcp/sse/:agentId`

### 2. stdio Transport

For local process communication (standard MCP).

**Start the server:**
```bash
TRANSPORT=stdio npm start
```

## MCP Client Configuration

### For Claude Desktop (or other standard MCP clients)

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "autoninja-hub": {
      "command": "node",
      "args": [
        "/absolute/path/to/ts-version/server/dist/server.js"
      ],
      "env": {
        "TRANSPORT": "stdio"
      }
    }
  }
}
```

Or using npm:

```json
{
  "mcpServers": {
    "autoninja-hub": {
      "command": "npm",
      "args": [
        "start",
        "--prefix",
        "/absolute/path/to/ts-version/server"
      ],
      "env": {
        "TRANSPORT": "stdio"
      }
    }
  }
}
```

### For Remote HTTP Connections

If you're running the server remotely on HTTP, you can connect using the SSE endpoint:

```json
{
  "mcpServers": {
    "autoninja-hub": {
      "url": "http://your-server:8000/sse"
    }
  }
}
```

**Note:** Most MCP clients prefer stdio for local connections. Use HTTP/SSE when the server needs to be remote or shared across multiple clients.

## Architecture

The server provides a central hub for agent communication with the following features:

### Tools

1. **register_agent** - Register an agent with the hub
   - Input: `agent_id`, `agent_type`, `version`
   - Output: Registration confirmation

2. **send_message** - Send a message to another agent
   - Input: `from_agent`, `to_agent`, `payload`, `conversation_id`, `reply_to`, `requires_response`
   - Output: Delivery confirmation with message ID

3. **list_agents** - List all connected agents
   - Input: None
   - Output: Array of agent information

4. **get_conversation** - Get conversation history
   - Input: `conversation_id`
   - Output: Conversation details with all messages

### Data Models

- **Message** - Individual message between agents
- **Conversation** - Multi-turn conversation tracking
- **AgentInfo** - Agent registration and status
- **AgentCapabilities** - Agent capabilities definition

### Transports

1. **stdio** - Standard input/output (recommended for MCP clients)
2. **HTTP/SSE** - HTTP with Server-Sent Events (for remote servers)
   - Standard MCP SSE endpoints for Claude Desktop compatibility
   - Legacy custom endpoints for existing client/agent packages

## Files

- `src/server.ts` - Main server implementation with both transports
- `src/models.ts` - Data models and utilities
- `tsconfig.json` - TypeScript configuration
- `package.json` - Package dependencies and scripts

## Configuration

The server is configured to use:
- Protocol Version: MCP 2024-11-05
- Default Transport: HTTP on port 8000
- Alternative Transport: stdio
- Module System: ES2022

## Dependencies

- `@modelcontextprotocol/sdk` - Official MCP SDK
- `express` - HTTP server
- `cors` - CORS middleware
- `uuid` - Unique identifier generation

## Environment Variables

- `TRANSPORT` - Set to `stdio` or `http` (default: `http`)
- `PORT` - HTTP server port (default: `8000`)

## API

The server exposes MCP tools via the standard MCP protocol. All communication follows JSON-RPC 2.0 format.

### Standard MCP Connection (HTTP/SSE)

Standard MCP clients connect to `POST /sse` and use Server-Sent Events for bidirectional communication.

### Legacy Custom API

#### Register Agent

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "tools/call",
  "params": {
    "name": "register_agent",
    "arguments": {
      "agent_id": "my_agent",
      "agent_type": "example",
      "version": "1.0.0"
    }
  }
}
```

#### Send Message

```json
{
  "jsonrpc": "2.0",
  "id": "2",
  "method": "tools/call",
  "params": {
    "name": "send_message",
    "arguments": {
      "from_agent": "agent1",
      "to_agent": "agent2",
      "payload": {
        "action": "request",
        "message": "Hello!"
      }
    }
  }
}
```

## Logging

The server logs to stderr (standard error) to avoid interfering with stdio protocol communication.

## Troubleshooting

**404 Error when connecting from Claude Desktop:**
- Make sure you're using `TRANSPORT=stdio` in the config
- For HTTP connections, ensure the URL points to `/sse` endpoint

**Port already in use:**
- Change the port: `PORT=9000 npm start`
- Or kill the process using port 8000

**Connection refused:**
- Ensure the server is running
- Check firewall settings if accessing remotely
- Verify the correct transport mode is being used
