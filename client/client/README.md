# MCP Hub CLI Client

Independent CLI client for interacting with the MCP Hub via HTTP and SSE.

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

## Features

- **Interactive CLI** - Command-line interface for hub interaction
- **Real-time Messaging** - Receives messages via Server-Sent Events (SSE)
- **Agent Communication** - Send messages to any connected agent
- **Agent Discovery** - List all connected agents

## Commands

### list

List all connected agents:

```
cli> list
```

Output shows:
- Agent ID
- Agent type
- Status
- Message count

### send <agent_id>

Send a message to an agent:

```
cli> send random_agent
message> Hello, can I get a random number?
```

You can also send JSON payloads:

```
cli> send random_agent
message> {"action": "request", "count": 5}
```

### quit / exit

Exit the client:

```
cli> quit
```

## Configuration

Default hub URL: `http://localhost:8000`

To change the hub URL, modify the constructor in `src/client.ts`:

```typescript
const client = new SimpleCLIClient('http://your-hub-url:port');
```

## Architecture

### Connection Flow

1. **Register** - Client registers with hub via HTTP POST to `/mcp/initialize`
2. **SSE Stream** - Client opens SSE connection to `/mcp/sse/{client_id}`
3. **Send Messages** - Client sends messages via HTTP POST to `/mcp/tools/call`
4. **Receive Messages** - Client receives messages via SSE stream

### Message Format

Messages follow JSON-RPC 2.0 format:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/message",
  "params": {
    "from_agent": "sender_id",
    "message_id": "msg_123abc",
    "conversation_id": "conv_456def",
    "payload": {
      "action": "response",
      "data": "..."
    }
  }
}
```

## Files

- `src/client.ts` - Main client implementation
- `tsconfig.json` - TypeScript configuration
- `package.json` - Package dependencies and scripts

## Dependencies

- `@modelcontextprotocol/sdk` - Official MCP SDK
- `eventsource` - Server-Sent Events client
- `node-fetch` - HTTP client
- `uuid` - Unique identifier generation

## Usage Example

```bash
# Start the client
npm start

# List agents
cli> list

# Send a message
cli> send random_agent
message> Give me a number

# Wait for response (arrives via SSE)
# Response will be displayed automatically

# Exit
cli> quit
```

## Troubleshooting

**Cannot connect to hub:**
- Ensure the MCP Hub server is running
- Check the hub URL is correct
- Verify port 8000 is accessible

**Messages not arriving:**
- Check SSE connection is established
- Look for connection errors in the output
- Verify the target agent is connected

**Registration failed:**
- Make sure the hub is running
- Check network connectivity
- Verify the `/mcp/initialize` endpoint is accessible
