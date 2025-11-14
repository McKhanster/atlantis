# Connecting Claude CLI to MCP Hub

This guide shows you how to connect the Claude CLI (Desktop or CLI tool) to your MCP Hub.

## Prerequisites

1. Hub server built and ready:
   ```bash
   cd /home/user/atlantis/src/infrastructure/server
   npm install
   npm run build
   ```

2. Claude CLI installed (or Claude Desktop app)

## Step 1: Locate Your MCP Config File

### For Claude Desktop
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### For Claude CLI
- Usually: `~/.config/claude/config.json`

If the file doesn't exist, create it.

## Step 2: Add Hub Configuration

You can connect using **stdio** (local) or **HTTP/SSE** (local or remote) transport.

### Option A: stdio Transport (Recommended for Local)

Best for single local client, lowest latency.

```json
{
  "mcpServers": {
    "hub": {
      "command": "node",
      "args": [
        "/home/user/atlantis/src/infrastructure/server/dist/server.js"
      ],
      "env": {
        "TRANSPORT": "stdio"
      }
    }
  }
}
```

**Important**: Replace `/home/user/atlantis` with the actual path to your atlantis directory!

### Option B: HTTP/SSE Transport (Works with Remote Hub)

Best for connecting to an already-running hub instance (local or remote).

**First, start the hub in HTTP mode:**
```bash
cd /home/user/atlantis
./scripts/start-hub-system.sh hub
```

**Then add this config:**
```json
{
  "mcpServers": {
    "hub": {
      "transport": "sse",
      "url": "http://localhost:8000/sse"
    }
  }
}
```

For a remote hub, change the URL:
```json
{
  "mcpServers": {
    "hub": {
      "transport": "sse",
      "url": "http://your-hub-server:8000/sse"
    }
  }
}
```

### Which Transport Should I Use?

| Feature | stdio | HTTP/SSE |
|---------|-------|----------|
| **Latency** | <0.1ms | 0.5-2ms (local), higher for remote |
| **Throughput** | 100K+ msg/sec | 10K-50K msg/sec |
| **Use Case** | Single local client | Multiple clients or remote access |
| **Debugging** | Harder | Easier (curl, browser tools) |
| **Setup** | Simpler | Need to start hub separately |
| **Clients** | One per hub instance | Unlimited |

**Recommendation**:
- Use **stdio** if you're the only client and hub is local
- Use **HTTP/SSE** if you need remote access or multiple clients

### How to Find Your Path

```bash
# In the atlantis directory
pwd
# Copy the output and use it in the config above
```

## Step 3: Restart Claude

- **Claude Desktop**: Quit and restart the application
- **Claude CLI**: Just run the CLI, it will load the new config

## Step 4: Verify Connection

### In Claude Desktop
The MCP server should appear in the integrations panel. You can check if it's connected.

### In Claude CLI
Ask Claude to use the hub tools:

```
You: Can you list the available tools from the hub server?
```

Claude should be able to see these tools:
- `register_agent` - Register an agent with the hub
- `send_message` - Send a message to another agent
- `list_agents` - List all connected agents
- `get_conversation` - Get conversation history

## Step 5: Use the Hub

Now you can ask Claude to interact with the hub:

```
You: Register a new agent called "claude_assistant" with type "ai_assistant"

You: List all connected agents

You: Send a message from "claude_assistant" to "random_agent" with payload {"action": "hello"}
```

## Example Use Cases

### 1. Agent Orchestration
```
You: Register me as an agent, then list all agents in the hub
```

### 2. Message Routing
```
You: Send a message from my agent to random_agent asking for a random number
```

### 3. Conversation Tracking
```
You: Show me the conversation history between claude_assistant and random_agent
```

## Troubleshooting

### "Server failed to connect" Error

**Problem**: MCP protocol error or server not responding

**Solutions**:
1. Verify the path in config is correct:
   ```bash
   ls -la /home/user/atlantis/src/infrastructure/server/dist/server.js
   ```

2. Test the server manually:
   ```bash
   cd /home/user/atlantis/src/infrastructure/server
   TRANSPORT=stdio node dist/server.js
   ```

   You should see:
   ```
   📡 Using STDIO transport
   🚀 MCP Hub Server running on stdio
   ```

3. Check the logs:
   ```bash
   tail -f /home/user/atlantis/src/infrastructure/server/logs/hub.log
   ```

4. Make sure Node.js version is 18+:
   ```bash
   node --version
   ```

### Server Starts But Tools Not Available

**Problem**: Server connects but tools don't appear

**Solution**: Check that the server is returning tools in the `tools/list` response. Look at logs for any errors.

### Permission Denied

**Problem**: Cannot execute server.js

**Solution**:
```bash
chmod +x /home/user/atlantis/src/infrastructure/server/dist/server.js
```

## Advanced Configuration

### Custom Log Path

```json
{
  "mcpServers": {
    "hub": {
      "command": "node",
      "args": [
        "/home/user/atlantis/src/infrastructure/server/dist/server.js"
      ],
      "env": {
        "TRANSPORT": "stdio",
        "LOG_PATH": "/custom/path/to/logs"
      }
    }
  }
}
```

### Debug Mode

Add debug logging:

```json
{
  "mcpServers": {
    "hub": {
      "command": "node",
      "args": [
        "/home/user/atlantis/src/infrastructure/server/dist/server.js"
      ],
      "env": {
        "TRANSPORT": "stdio",
        "DEBUG": "true",
        "LOG_LEVEL": "DEBUG"
      }
    }
  }
}
```

## What's Happening Behind the Scenes

When Claude connects to the hub:

1. **Initialization**: Claude sends an `initialize` request
2. **Server Response**: Hub responds with capabilities and server info
3. **Tool Discovery**: Claude calls `tools/list` to get available tools
4. **Ready**: Claude can now call tools like `register_agent`, `send_message`, etc.

All of this is logged by the centralized logging system!

## View Hub Logs in Real-Time

While using Claude with the hub, watch the logs:

```bash
# In another terminal
tail -f /home/user/atlantis/src/infrastructure/server/logs/hub.log

# Or view with jq for pretty JSON
tail -f /home/user/atlantis/src/infrastructure/server/logs/hub.log | jq
```

You'll see:
- When Claude connects (initialize)
- Tool calls Claude makes
- Messages being routed
- Agent registrations
- All interactions!

## Example Session

```
You: Hi Claude, can you help me work with the hub?

Claude: I can help you with the hub! I have access to these tools:
- register_agent: Register a new agent
- send_message: Send messages between agents
- list_agents: See all connected agents
- get_conversation: View conversation history

What would you like to do?

You: Register me as an agent called "user_agent"

Claude: [Calls register_agent tool]
I've registered you as "user_agent" in the hub!

You: Now list all connected agents

Claude: [Calls list_agents tool]
Here are the connected agents:
1. user_agent (just registered)
2. random_agent (responds with random numbers)
...
```

## Complete Example Config

### Example 1: Multiple MCP Servers (stdio)

```json
{
  "mcpServers": {
    "hub": {
      "command": "node",
      "args": [
        "/home/user/atlantis/src/infrastructure/server/dist/server.js"
      ],
      "env": {
        "TRANSPORT": "stdio"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user"]
    }
  }
}
```

Now Claude has access to both the hub AND filesystem tools!

### Example 2: HTTP/SSE Transport (Connecting to Running Hub)

```json
{
  "mcpServers": {
    "hub": {
      "transport": "sse",
      "url": "http://localhost:8000/sse"
    }
  }
}
```

**Use Case**: Hub is already running for other agents, you want Claude to connect to the same instance.

### Example 3: Multiple Clients to Same Hub

Start hub once in HTTP mode:
```bash
./scripts/start-hub-system.sh hub
```

**Claude Desktop config**:
```json
{
  "mcpServers": {
    "hub": {
      "transport": "sse",
      "url": "http://localhost:8000/sse"
    }
  }
}
```

**Claude CLI config** (different client):
```json
{
  "mcpServers": {
    "hub": {
      "transport": "sse",
      "url": "http://localhost:8000/sse"
    }
  }
}
```

**Result**: Both Claude Desktop AND Claude CLI connected to the same hub! They can see each other as agents.

### Example 4: Remote Hub

Hub running on server `192.168.1.100`:
```json
{
  "mcpServers": {
    "hub": {
      "transport": "sse",
      "url": "http://192.168.1.100:8000/sse"
    }
  }
}
```

## Next Steps

1. Start the random agent to test messaging:
   ```bash
   cd /home/user/atlantis/client/agent
   npm start
   ```

2. Ask Claude to send it a message:
   ```
   You: Send a message to random_agent and see what it responds
   ```

3. Check the logs to see the full interaction flow!

## Security Notes

- The hub only listens on stdio when connected to Claude CLI (no network exposure)
- All tool calls are logged for audit purposes
- Consider implementing authentication if exposing the HTTP endpoint

## Quick Reference

### Transport Comparison

| Transport | Command | When to Use |
|-----------|---------|-------------|
| **stdio** | Spawns hub process | Single local client, max performance |
| **HTTP/SSE** | Connects to URL | Multiple clients, remote access, debugging |

### Configuration Templates

**stdio (Local)**:
```json
{
  "mcpServers": {
    "hub": {
      "command": "node",
      "args": ["/path/to/server.js"],
      "env": {"TRANSPORT": "stdio"}
    }
  }
}
```

**HTTP/SSE (Local Hub)**:
```json
{
  "mcpServers": {
    "hub": {
      "transport": "sse",
      "url": "http://localhost:8000/sse"
    }
  }
}
```

**HTTP/SSE (Remote Hub)**:
```json
{
  "mcpServers": {
    "hub": {
      "transport": "sse",
      "url": "http://hub-server:8000/sse"
    }
  }
}
```

### Available Tools

Once connected, Claude can use:

| Tool | Purpose |
|------|---------|
| `register_agent` | Register a new agent in the hub |
| `send_message` | Send message from one agent to another |
| `list_agents` | List all connected agents |
| `get_conversation` | Get conversation history |

### Hub Endpoints (HTTP mode)

| Endpoint | Purpose |
|----------|---------|
| `POST http://localhost:8000/sse` | MCP SSE connection |
| `GET http://localhost:8000/health` | Health check |
| `GET http://localhost:8000/logs` | Query logs |
| `GET http://localhost:8000/logs/stats` | Log statistics |

## Support

- Hub documentation: `/home/user/atlantis/HUB_README.md`
- Quick start: `/home/user/atlantis/QUICKSTART_HUB.md`
- MCP specification: https://modelcontextprotocol.io/

---

**That's it! Claude is now connected to your MCP Hub.** 🎉
