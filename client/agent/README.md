# Random Number Agent

Example MCP agent that connects to the hub and replies to messages with random numbers.

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

- **Auto-Connect** - Automatically connects to MCP Hub
- **SSE Listener** - Receives messages via Server-Sent Events
- **Auto-Reply** - Automatically replies to all incoming messages
- **Random Numbers** - Generates random numbers between 1-1000

## Behavior

1. Agent connects to MCP Hub via HTTP
2. Opens SSE stream to listen for messages
3. When a message arrives:
   - Logs the incoming message
   - Generates a random number (1-1000)
   - Sends reply with the random number
4. Continues listening for more messages

## Configuration

Default settings:
- **Agent ID:** `random_agent`
- **Hub URL:** `http://localhost:8000`

To customize, modify the constructor in `src/agent.ts`:

```typescript
const agent = new RandomAgent('my_agent_id', 'http://hub-url:port');
```

## Architecture

### Connection Flow

1. **Initialize** - Connects to hub via HTTP POST to `/mcp/initialize`
2. **SSE Stream** - Opens SSE connection to `/mcp/sse/{agent_id}`
3. **Receive** - Listens for messages on SSE stream
4. **Process** - Generates random number
5. **Reply** - Sends response via HTTP POST to `/mcp/tools/call`

### Message Handling

When receiving a message:

```typescript
{
  from_agent: "cli_user_abc123",
  message_id: "msg_xyz789",
  conversation_id: "conv_def456",
  payload: {
    action: "request",
    message: "Hello!"
  }
}
```

Agent replies with:

```typescript
{
  action: "response",
  random_number: 742,
  message: "Here's your random number: 742",
  original_request: { /* original payload */ }
}
```

## Files

- `src/agent.ts` - Main agent implementation
- `tsconfig.json` - TypeScript configuration
- `package.json` - Package dependencies and scripts

## Dependencies

- `@modelcontextprotocol/sdk` - Official MCP SDK
- `eventsource` - Server-Sent Events client
- `node-fetch` - HTTP client
- `uuid` - Unique identifier generation

## Usage Example

```bash
# Start the agent
npm start

# Output:
# 🎲 Random Number Agent
# ====================================
# Starting agent...
# Agent will wait for messages and reply with random numbers
# Press Ctrl+C to stop
# ====================================
#
# 🤖 Created random_agent
# ✅ random_agent connected to hub
# 🔌 random_agent connecting to SSE: http://localhost:8000/mcp/sse/random_agent
# ✅ random_agent ready and waiting for messages
# 🔌 random_agent SSE connected

# When a message arrives:
# 📬 random_agent received message from cli_user_abc123
#    Message ID: msg_xyz789
#    Payload: {"action":"request","message":"Hello!"}
# 🎲 Generated random number: 742
# 📤 random_agent → cli_user_abc123: message sent
# ✅ random_agent sent reply with random number 742
```

## Extending the Agent

To create your own agent based on this example:

1. Copy the agent directory
2. Modify the `handleIncomingMessage` method to implement your logic
3. Change the agent ID and type in the constructor
4. Update the response payload structure as needed

Example custom agent:

```typescript
private async handleIncomingMessage(messageData: MessageData): Promise<void> {
  const { from_agent, message_id, conversation_id, payload } = messageData.params;

  // Your custom logic here
  const result = await yourCustomFunction(payload);

  // Send custom response
  await this.sendMessage(
    from_agent,
    {
      action: 'response',
      result: result,
      timestamp: new Date().toISOString()
    },
    conversation_id,
    message_id
  );
}
```

## Troubleshooting

**Cannot connect to hub:**
- Ensure the MCP Hub server is running
- Check the hub URL is correct
- Verify port 8000 is accessible

**Not receiving messages:**
- Check SSE connection status in logs
- Verify agent registered successfully
- Check hub logs for any errors

**SSE keeps reconnecting:**
- This is normal behavior if connection drops
- Agent will automatically reconnect every 2 seconds
- Ensure hub is stable and running
