# MCP Hub Quick Start Guide

## What You Have

A fully functional MCP (Model Context Protocol) hub with:

✅ **Centralized Logging System** - Logs ALL interactions to console, file, and memory
✅ **MCP Compliant** - Works with Claude CLI via stdio transport
✅ **HTTP/SSE Support** - For remote agents and clients
✅ **REST API** - Query logs, view stats, manage system
✅ **Startup Script** - Easy one-command startup

## Start the System (3 Commands)

```bash
# 1. Make the script executable (first time only)
chmod +x scripts/start-hub-system.sh

# 2. Start everything (hub + agent)
./scripts/start-hub-system.sh all

# 3. In another terminal, test the client
cd client/client
npm start
```

That's it! The system is now running.

## What's Running?

1. **Hub Server** (localhost:8000)
   - MCP hub coordinating all agent communication
   - Logging all interactions to `logs/hub.log`
   - Serving REST APIs for log queries

2. **Random Agent**
   - Example agent that replies with random numbers
   - Connected to the hub
   - Visible when you run `list` in the client

3. **CLI Client** (interactive)
   - Send messages to agents
   - Receive responses in real-time
   - List connected agents

## Try It Out

In the client terminal:

```bash
cli> list                    # See connected agents
cli> send random_agent       # Send message to agent
message> Hello               # Type your message
```

You'll see:
- The message being sent
- The agent processing it
- A response with a random number
- All logged in real-time!

## Check the Logs

### Console Output
The hub shows colorful, pretty-printed logs in the console:

```
[2025-11-13T16:20:31.479Z] INFO  🚀 HUB_STARTED - MCP Hub Context initialized
[2025-11-13T16:20:35.123Z] INFO  ✅ AGENT_REGISTERED - Agent registered: random_agent
[2025-11-13T16:20:40.456Z] INFO  📤 MESSAGE_SENT - Message sent from cli_user to random_agent
```

### Log File
Check `logs/hub.log` for JSON formatted logs:

```bash
tail -f logs/hub.log
```

### REST API
Query logs programmatically:

```bash
# Get all logs
curl http://localhost:8000/logs

# Get statistics
curl http://localhost:8000/logs/stats

# Filter by agent
curl "http://localhost:8000/logs?agentId=random_agent"

# Filter by event type
curl "http://localhost:8000/logs?eventType=MESSAGE_SENT"
```

## Connect Claude CLI

To connect Claude CLI via stdio:

1. Start hub in stdio mode:
```bash
cd src/infrastructure/server
TRANSPORT=stdio npm start
```

2. Add to Claude CLI config (`~/.config/claude/config.json`):
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

3. Claude CLI will now have access to hub tools:
   - `register_agent`
   - `send_message`
   - `list_agents`
   - `get_conversation`

## Stop the System

```bash
# Graceful shutdown
./scripts/start-hub-system.sh stop

# Or just Ctrl+C when running
```

## What Logs Are Captured?

The centralized logging system tracks:

### Agent Events
- Registration
- Disconnection
- Errors

### Message Events
- Sent
- Delivered
- Failed
- Received

### Conversation Events
- Started
- Updated
- Completed

### System Events
- Hub start/stop
- SSE connections/disconnections

### MCP Protocol Events
- Initialize calls
- Tool calls
- Tool responses
- Protocol errors

## Log Levels

- **DEBUG**: Detailed information for debugging
- **INFO**: General informational messages (default)
- **WARN**: Warning messages
- **ERROR**: Error messages

Change log level in code:

```typescript
const hub = new MCPHub({
  logLevel: LogLevel.DEBUG  // See everything
});
```

## Endpoints Summary

### MCP Endpoints
- `POST /sse` - Standard MCP SSE (Claude CLI)
- `POST /mcp/initialize` - Register agent
- `POST /mcp/tools/call` - Call MCP tools
- `GET /mcp/sse/:agentId` - SSE stream for agent

### Log Endpoints
- `GET /logs` - Query logs (with filters)
- `GET /logs/stats` - Statistics
- `POST /logs/clear` - Clear logs

### System Endpoints
- `GET /health` - Health check

## Architecture

```
Hub (Port 8000)
├── Logger
│   ├── Console (colored, pretty)
│   ├── File (logs/hub.log)
│   └── Memory (queryable via API)
├── MCP Server
│   ├── stdio transport (Claude CLI)
│   └── HTTP/SSE transport (agents)
└── Agent Manager
    ├── Registration
    ├── Message routing
    └── Conversation tracking

Connected Agents
├── random_agent (example)
└── Your agents here...

CLI Client (interactive)
└── Send/receive messages
```

## Next Steps

1. **Explore the logs**: See all the tracked interactions
2. **Create your own agent**: Copy `client/agent` and customize
3. **Build integrations**: Use the REST APIs
4. **Connect Claude CLI**: Use the hub as an MCP server

## Troubleshooting

**Port in use?**
```bash
lsof -i :8000
kill -9 <PID>
```

**Can't see logs?**
```bash
mkdir -p logs
ls -la logs/
```

**Agent won't connect?**
```bash
curl http://localhost:8000/health
```

## More Info

- Full documentation: `HUB_README.md`
- Hub code: `src/infrastructure/server/src/`
- Example agent: `client/agent/src/agent.ts`
- Example client: `client/client/src/client.ts`

---

**That's it! You now have a fully functional MCP hub with centralized logging.** 🚀
