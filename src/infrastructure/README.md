# AutoNinja2 - TypeScript Version

This directory contains TypeScript implementations of the MCP Hub system using the official [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk).

## Structure

The system consists of three independent packages:

- **server/** - MCP Hub Server (agent-to-agent communication hub)
- **client/** - CLI Client (interactive command-line interface)
- **agent/** - Random Number Agent (example agent that replies with random numbers)

Each package is completely independent with its own `package.json`, `tsconfig.json`, and dependencies.

## Quick Start

### 1. Install Dependencies

Each package needs its dependencies installed separately:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Install agent dependencies
cd ../agent
npm install
```

### 2. Build All Packages

```bash
# Build server
cd server
npm run build

# Build client
cd ../client
npm run build

# Build agent
cd ../agent
npm run build
```

### 3. Run the System

Open three separate terminal windows:

**Terminal 1 - Start the Hub Server:**
```bash
cd ts-version/server
npm start
```

**Terminal 2 - Start the Random Agent:**
```bash
cd ts-version/agent
npm start
```

**Terminal 3 - Start the CLI Client:**
```bash
cd ts-version/client
npm start
```

### 4. Test the Communication

In the CLI client terminal:

1. List connected agents:
   ```
   cli> list
   ```

2. Send a message to the random agent:
   ```
   cli> send random_agent
   message> Hello, can I get a random number?
   ```

3. Watch for the response to arrive via SSE!

## Package Details

### Server Package

The MCP Hub Server manages agent registration and message routing.

- **Location:** `ts-version/server/`
- **Main File:** `src/server.ts`
- **Models:** `src/models.ts`
- **Transport:** stdio (standard input/output)

**Features:**
- Agent registration
- Message routing between agents
- Conversation tracking
- Message queuing

### Client Package

Independent CLI client for interacting with the hub.

- **Location:** `ts-version/client/`
- **Main File:** `src/client.ts`
- **Transport:** HTTP with SSE for receiving messages

**Commands:**
- `list` - List all connected agents
- `send <agent_id>` - Send message to an agent
- `quit` - Exit the client

### Agent Package

Example agent that responds to messages with random numbers.

- **Location:** `ts-version/agent/`
- **Main File:** `src/agent.ts`
- **Transport:** HTTP with SSE for receiving messages

**Behavior:**
- Listens for incoming messages via SSE
- Generates random numbers (1-1000)
- Sends reply back to the sender

## Development

### Watch Mode

For development with auto-recompilation:

```bash
# In any package directory
npm run watch
```

### Manual Build

```bash
npm run build
```

### Run After Build

```bash
npm start
```

## Technology Stack

- **TypeScript** - Type-safe JavaScript
- **@modelcontextprotocol/sdk** - Official MCP SDK
- **EventSource** - Server-Sent Events for real-time messaging
- **node-fetch** - HTTP client
- **uuid** - Unique identifier generation

## Notes

- Each package runs independently
- Server uses stdio transport (standard MCP)
- Client and agent use HTTP + SSE for communication
- All packages use ES modules (type: "module")
- TypeScript compiled to ES2022 target

## Troubleshooting

**Port already in use:**
- Make sure only one instance of the server is running
- Default port is 8000

**Connection refused:**
- Ensure the server is running before starting clients/agents
- Check the hub URL (default: http://localhost:8000)

**TypeScript errors:**
- Make sure you've run `npm install` in each package
- Run `npm run build` to check for compilation errors
