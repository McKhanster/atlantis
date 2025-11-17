# MCP Hub System

A feature-rich Model Context Protocol (MCP) hub with centralized logging for agent-to-agent communication.

## Features

- **MCP Compliant**: Fully compliant with MCP specification, works with Claude CLI
- **Dual Transport**: Supports both stdio (for Claude CLI) and HTTP/SSE (for remote agents)
- **Centralized Logging**: Comprehensive logging system tracking all interactions
- **Agent Management**: Register, track, and manage multiple agents
- **Message Routing**: Reliable message delivery with conversation tracking
- **REST API**: Query logs, view stats, and monitor system health

## Quick Start

### Start Everything

```bash
# Start hub, agent, and client
./scripts/start-hub-system.sh all

# Or use npm script
npm run hub:start
```

### Start Individual Components

```bash
# Start only the hub
./scripts/start-hub-system.sh hub

# Start only the agent
./scripts/start-hub-system.sh agent

# Start only the client
./scripts/start-hub-system.sh client
```

### Check Status

```bash
./scripts/start-hub-system.sh status
```

### Stop Everything

```bash
./scripts/start-hub-system.sh stop

# Or press Ctrl+C when running in foreground
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        MCP Hub                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Centralized Logger                  │   │
│  │  • File logging (logs/hub.log)                      │   │
│  │  • Console logging (pretty-printed)                 │   │
│  │  • Memory storage for queries                       │   │
│  │  • Event tracking (agents, messages, conversations) │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                 │
│  ┌──────────────┬──────────────┬────────────────────────┐  │
│  │ Agent Mgmt   │ Message      │ Conversation Tracking │  │
│  │ • Register   │ • Queue      │ • History             │  │
│  │ • Track      │ • Deliver    │ • Participants        │  │
│  │ • Monitor    │ • Route      │ • Status              │  │
│  └──────────────┴──────────────┴────────────────────────┘  │
│                           ↓                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Transport Layer (MCP Protocol)              │   │
│  │  • stdio: For Claude CLI connection                 │   │
│  │  • HTTP/SSE: For remote agents & clients            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓
    ┌──────────────────────────────────────────────┐
    │                                              │
┌───┴───┐         ┌──────────┐         ┌─────────┴──┐
│ Agent │         │  Client  │         │ Claude CLI │
│       │         │   (CLI)  │         │            │
└───────┘         └──────────┘         └────────────┘
```

## Logging System

The hub includes a comprehensive centralized logging system that tracks all interactions:

### Log Event Types

- **Agent Lifecycle**: Registration, disconnection, errors
- **Message Lifecycle**: Sent, delivered, failed, received
- **Conversation Lifecycle**: Started, updated, completed
- **System Events**: Hub start/stop, SSE connections
- **MCP Protocol**: Initialize, tool calls, tool responses, errors

### Log API Endpoints

```bash
# Get all logs
curl http://localhost:8000/logs

# Get logs with filters
curl "http://localhost:8000/logs?level=ERROR&agentId=random_agent"

# Get log statistics
curl http://localhost:8000/logs/stats

# Clear logs
curl -X POST http://localhost:8000/logs/clear
```

### Log File

Logs are written to `logs/hub.log` in JSON format for easy parsing and analysis.

### Log Query Filters

- `level`: DEBUG, INFO, WARN, ERROR
- `eventType`: AGENT_REGISTERED, MESSAGE_SENT, etc.
- `agentId`: Filter by specific agent
- `conversationId`: Filter by conversation
- `since`: ISO timestamp for time-based filtering

## MCP Endpoints

### Standard MCP Endpoints (Claude CLI Compatible)

```bash
# SSE connection (for Claude Desktop, etc)
POST http://localhost:8000/sse

# Message endpoint
POST http://localhost:8000/message
```

### Custom HTTP Endpoints (For Remote Agents)

```bash
# Initialize/Register
POST http://localhost:8000/mcp/initialize
Content-Type: application/json

{
  "protocolVersion": "2024-11-05",
  "capabilities": {},
  "clientInfo": {
    "name": "my_agent",
    "type": "custom_agent",
    "version": "1.0.0"
  }
}

# Call tools
POST http://localhost:8000/mcp/tools/call
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": "req_123",
  "method": "tools/call",
  "params": {
    "name": "send_message",
    "arguments": {
      "from_agent": "agent1",
      "to_agent": "agent2",
      "payload": {"message": "Hello!"}
    }
  }
}

# SSE stream (for receiving messages)
GET http://localhost:8000/mcp/sse/:agentId
```

## Available Tools

### register_agent
Register an agent with the hub.

### send_message
Send a message from one agent to another.

### list_agents
List all connected agents.

### get_conversation
Get conversation history by conversation ID.

## Connecting Claude CLI

To connect Claude CLI to the hub, use stdio transport:

```bash
# Start hub in stdio mode
cd src/infrastructure/server
TRANSPORT=stdio npm start
```

Then configure Claude CLI to use the hub:

```json
{
  "mcpServers": {
    "hub": {
      "command": "node",
      "args": ["/path/to/atlantis/src/infrastructure/server/dist/server.js"],
      "env": {
        "TRANSPORT": "stdio"
      }
    }
  }
}
```

## Development

### Build All Components

```bash
# From hub directory
cd src/infrastructure/server
npm install
npm run build

# From agent directory
cd client/agent
npm install
npm run build

# From client directory
cd client/client
npm install
npm run build
```

### Watch Mode

```bash
# Watch for changes and rebuild
cd src/infrastructure/server
npm run watch
```

## Configuration

### Environment Variables

- `PORT`: Hub HTTP port (default: 8000)
- `TRANSPORT`: Transport mode - `http` or `stdio` (default: http)
- `LOG_PORT`: Log server port (default: 3002)

### Logger Configuration

```typescript
const hub = new MCPHub({
  logToConsole: true,        // Log to console
  logToFile: true,           // Log to file
  logFilePath: './logs/hub.log',
  logLevel: LogLevel.INFO,   // Minimum log level
  prettyPrint: true,         // Pretty console output
  includeTimestamp: true,
  includeStackTrace: false,
});
```

## System Requirements

- Node.js 18+
- npm 9+
- TypeScript 5+

## Health Monitoring

```bash
# Check system health
curl http://localhost:8000/health

# Response
{
  "status": "healthy",
  "agents": 2,
  "conversations": 5
}
```

## Example Usage

### 1. Start the system

```bash
./scripts/start-hub-system.sh all
```

### 2. Use the CLI client to interact

The client will start automatically. Use these commands:

```
cli> list                    # List all connected agents
cli> send random_agent       # Send message to random_agent
message> {"action": "test"}  # Enter message payload
```

### 3. Check logs

```bash
# In another terminal
curl http://localhost:8000/logs/stats

# View log file
tail -f logs/hub.log
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

### Agent Won't Connect

- Check hub is running: `curl http://localhost:8000/health`
- Check hub logs: `tail -f logs/hub.log`
- Verify agent is using correct hub URL

### Logs Not Appearing

- Check logs directory exists: `mkdir -p logs`
- Verify write permissions
- Check console output for logger initialization errors

## License

MIT
