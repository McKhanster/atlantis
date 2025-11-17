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

Claude CLI/Desktop **only supports stdio transport** via the `command` configuration. Add this to your config file:

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

### What About HTTP/SSE Transport?

The hub supports HTTP/SSE transport, but **Claude CLI/Desktop cannot use it**. The HTTP/SSE endpoints are for:
- Custom agents (like the random agent)
- Web applications
- Other MCP clients

Claude CLI/Desktop spawns the hub as a subprocess and communicates via stdio only.

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

### Multiple MCP Servers

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

### How Multiple Instances Work

**Important**: Each Claude instance (Desktop or CLI) spawns its own hub process. They **cannot share a hub instance** via the config file.

If you want multiple clients to share a hub:
1. Run the hub separately in HTTP mode: `./scripts/start-hub-system.sh hub`
2. Custom agents connect via HTTP/SSE (like the random agent does)
3. Claude instances spawn their own hub processes via stdio

Each hub instance can route messages between all connected agents, but Claude clients always get their own hub instance.

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

### Claude CLI/Desktop Configuration

**Only stdio transport is supported:**

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

### Hub Transport Modes

| Transport | Used By | How to Connect |
|-----------|---------|----------------|
| **stdio** | Claude CLI/Desktop | Via `command` in config (spawns process) |
| **HTTP/SSE** | Custom agents, web apps | Direct HTTP connection to running hub |

**Key Point**: Claude CLI/Desktop uses stdio. Custom agents use HTTP/SSE.

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
