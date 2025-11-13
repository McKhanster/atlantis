# Atlantis Core - Function Inventory

## Infrastructure Layer

### MCP Hub Server (`infrastructure/server/src/server.ts`)

#### Core Classes
- **MCPHub**: Main MCP server class with dual transport support (HTTP/stdio)
  - `constructor()`: Initialize server with MCP SDK
  - `setupHandlers()`: Configure MCP request handlers for tools
  - `runStdio()`: Start server with stdio transport for local communication
  - `runHttp(port)`: Start server with HTTP transport for remote communication
  - `getServer()`: Get underlying MCP server instance

#### Tool Handlers
- **handleRegisterAgent(args)**: Register new agent with hub
- **handleSendMessage(args)**: Route messages between agents
- **handleListAgents()**: List all connected agents
- **handleGetConversation(args)**: Retrieve conversation history

#### Context Management
- **createHubContext()**: Initialize hub state with agent registry and message queues

#### HTTP Endpoints
- `POST /mcp/initialize`: MCP handshake and agent registration
- `POST /mcp/tools/call`: Execute MCP tools via HTTP
- `GET /mcp/sse/:agentId`: Server-sent events for real-time messaging
- `GET /health`: Health check endpoint

### Data Models (`infrastructure/server/src/models.ts`)

#### Message System
- **createMessage()**: Create new message with UUID and metadata
- **messageToJsonRpc()**: Convert message to JSON-RPC format
- **Message**: Interface for agent-to-agent messages

#### Conversation Management
- **createConversation()**: Initialize new conversation
- **addMessageToConversation()**: Add message and update conversation state
- **Conversation**: Interface for multi-message conversations

#### Agent Registry
- **createAgentInfo()**: Create agent registration record
- **AgentInfo**: Interface for agent metadata and capabilities
- **AgentCapabilities**: Interface for agent feature declarations

## Tools Layer

### Log Server (`tools/log-server.ts`)
- **HTTP Server**: Central logging aggregation service
  - `POST /log`: Accept log entries from all MCP instances
  - `GET /logs`: Retrieve aggregated log history
- **Real-time Console Output**: Live log streaming to console

## Type Definitions

### Interfaces
- **HubContext**: Server state management
- **SendMessageArgs**: Message routing parameters
- **RegisterAgentArgs**: Agent registration parameters
- **GetConversationArgs**: Conversation query parameters

## Entry Points

### Main Server (`index.ts`)
- Currently disabled/commented out
- Designed for programmatic and CLI usage

## Centralized Logging
All components use centralized logging through the log server for real-time monitoring and debugging.