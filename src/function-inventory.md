# Atlantis Core - Function Inventory

## Project Structure

```
src/
├── index.ts                    # Main entry point
└── server/
    ├── index.ts                # Re-exports server modules
    ├── package.json           # Server-specific dependencies
    └── src/
        ├── server.ts           # MCPHub server implementation
        ├── models.ts           # Data models and entities
        ├── logger.ts           # Centralized logging system
        ├── sessionManager.ts   # Session lifecycle management
        └── eventStore.ts       # Event storage for resumability
```

## Core Server (`server/src/server.ts`)

### MCPHub Class
Main MCP server class implementing agent-to-agent communication hub with dual transport support.

#### Constructor & Initialization
- `constructor(loggerConfig?)`: Initialize server with MCP SDK and logger
- `setupHandlers()`: Configure MCP request handlers (initialize, list tools, call tools)

#### Transport Methods
- `runStdio()`: Start server with stdio transport for local/CLI communication (Claude CLI)
- `runHttp(port)`: Start server with HTTP transport for remote communication (custom agents)

#### Tool Handlers
- `handleRegisterAgent(args: RegisterAgentArgs)`: Register new agent with the hub
  - Input: `{ agent_id, agent_type, version? }`
  - Returns: Agent registration confirmation with metadata

- `handleSendMessage(args: SendMessageArgs)`: Route messages between agents
  - Input: `{ from_agent, to_agent, payload, conversation_id?, reply_to?, requires_response? }`
  - Returns: Message delivery confirmation with message_id and conversation_id

- `handleListAgents()`: List all connected agents
  - Returns: Array of agent info with registration details and statistics

- `handleGetConversation(args: GetConversationArgs)`: Retrieve conversation history
  - Input: `{ conversation_id }`
  - Returns: Full conversation with all messages and metadata

#### Lifecycle Methods
- `getServer()`: Get underlying MCP Server instance
- `getLogger()`: Get HubLogger instance
- `shutdown()`: Graceful shutdown with session cleanup

### HTTP/MCP Endpoints

#### MCP Protocol Endpoints (StreamableHTTPServerTransport)
- `POST /mcp`: Handle MCP requests (initialize, tool calls)
  - Initialize: Creates new session, returns `Mcp-Session-Id` header
  - Tool calls: Requires `Mcp-Session-Id` header from previous initialization

- `GET /mcp`: Server-Sent Events (SSE) stream for notifications
  - Requires `Mcp-Session-Id` header
  - Supports `Last-Event-ID` header for resumability

- `DELETE /mcp`: Terminate MCP session
  - Requires `Mcp-Session-Id` header
  - Cleanly closes session and cleans up resources

#### Management Endpoints
- `GET /health`: Health check with system stats
  - Returns: `{ status, agents, conversations, sessions, uptime }`

- `GET /sessions`: List all active sessions
  - Returns: Session metadata with activity timestamps

- `GET /logs`: Query centralized logs
  - Query params: `level`, `eventType`, `agentId`, `conversationId`, `since`
  - Returns: Filtered log entries

- `GET /logs/stats`: Log statistics
  - Returns: Aggregated log metrics and event counts

- `POST /logs/clear`: Clear log history
  - Returns: Confirmation status

## Session Management (`server/src/sessionManager.ts`)

### SessionManager Class
Manages MCP session lifecycle with automatic timeout and cleanup.

#### Configuration
- `sessionTimeout`: 5 minutes (default)
- `heartbeatInterval`: 30 seconds (default)
- `cleanupInterval`: 1 minute (default)

#### Core Methods
- `registerSession(sessionId, transport, clientInfo?)`: Register new session
- `updateActivity(sessionId)`: Update last activity timestamp
- `getTransport(sessionId)`: Get transport for session (auto-updates activity)
- `hasSession(sessionId)`: Check if session exists
- `removeSession(sessionId, reason)`: Remove session and cleanup resources
- `getSessionMetadata(sessionId)`: Get session details
- `getAllSessionIds()`: Get all active session IDs
- `getSessionCount()`: Get total session count
- `getStats()`: Get session statistics (total, oldest, newest, avgAge)
- `shutdown()`: Clean up all sessions on server shutdown

#### Automatic Cleanup
- Periodic cleanup timer runs every `cleanupInterval`
- Sessions timeout after `sessionTimeout` of inactivity
- Proper resource cleanup (intervals, transport references)
- Prevents circular references in transport lifecycle

## Centralized Logging (`server/src/logger.ts`)

### HubLogger Class
Multi-channel logging system with structured events and metadata.

#### Configuration
- `logToConsole`: Enable console output (default: true)
- `logToFile`: Enable file logging (default: true)
- `logFilePath`: Log file location (default: './logs/hub.log')
- `maxLogEntries`: In-memory log limit (default: 10000)
- `prettyPrint`: Pretty console output (default: true)

#### Log Levels
- `DEBUG`: Detailed diagnostic information
- `INFO`: General informational messages
- `WARN`: Warning messages
- `ERROR`: Error messages

#### Event Types
17 specialized event types for different operations:
- `HUB_STARTED`, `HUB_STOPPED`: Server lifecycle
- `AGENT_REGISTERED`, `AGENT_DISCONNECTED`: Agent management
- `MESSAGE_SENT`, `MESSAGE_RECEIVED`, `MESSAGE_QUEUED`: Message routing
- `CONVERSATION_STARTED`, `CONVERSATION_UPDATED`: Conversation tracking
- `MCP_INITIALIZE`, `MCP_TOOL_CALL`, `MCP_TOOL_RESPONSE`: MCP operations
- `MCP_ERROR`: MCP protocol errors
- `SSE_CONNECTED`, `SSE_DISCONNECTED`: SSE stream lifecycle
- `STORAGE_READ`, `STORAGE_WRITE`: Storage operations

#### Core Methods
- `log(level, eventType, message, metadata?)`: Generic log method
- `debug()`, `info()`, `warn()`, `error()`: Level-specific methods
- `getLogs(filter?)`: Query logs with filters
- `getStats()`: Get log statistics
- `clearLogs()`: Clear in-memory logs
- `close()`: Close file stream

#### Domain-Specific Methods
- `logAgentRegistered(agent)`: Log agent registration
- `logAgentDisconnected(agentId)`: Log agent disconnection
- `logMessageSent(message)`: Log message sent event
- `logMessageReceived(message)`: Log message received event
- `logConversationStarted(conversation)`: Log conversation start
- `logMCPInitialize(sessionId, clientInfo)`: Log MCP initialization
- `logMCPToolCall(toolName, agentId, args)`: Log MCP tool call
- `logMCPToolResponse(toolName, success, duration)`: Log MCP tool response
- `logSSEConnected(sessionId)`: Log SSE connection
- `logSSEDisconnected(sessionId, reason)`: Log SSE disconnection

## Data Models (`server/src/models.ts`)

### Message System
- `Message`: Agent-to-agent message interface
  - `message_id`: UUID
  - `from_agent`: Sender agent ID
  - `to_agent`: Recipient agent ID
  - `payload`: Message content (any structure)
  - `timestamp`: ISO 8601 timestamp
  - `conversation_id?`: Optional conversation reference
  - `reply_to?`: Optional message ID being replied to
  - `requires_response`: Boolean flag

- `createMessage(...)`: Factory function to create new messages

### Conversation Management
- `Conversation`: Multi-message conversation interface
  - `conversation_id`: UUID
  - `participants`: Array of agent IDs
  - `messages`: Array of Message objects
  - `started_at`: ISO 8601 timestamp
  - `updated_at`: ISO 8601 timestamp
  - `status`: 'active' | 'closed'

- `createConversation(...)`: Factory function to create conversations
- `addMessageToConversation(conversation, message)`: Add message to conversation

### Agent Registry
- `AgentInfo`: Agent metadata interface
  - `agent_id`: Unique identifier
  - `agent_type`: Agent type/category
  - `version`: Agent version
  - `capabilities`: AgentCapabilities object
  - `registered_at`: ISO 8601 timestamp
  - `last_seen`: ISO 8601 timestamp
  - `status`: 'active' | 'idle' | 'disconnected'
  - `messages_processed`: Message count

- `AgentCapabilities`: Agent feature declarations
  - `can_process_batch`: Boolean
  - `supported_formats`: Array of supported formats
  - `custom`: Record<string, any>

- `createAgentInfo(...)`: Factory function to create agent info

### Utility Functions
- `messageToJsonRpc(message)`: Convert Message to JSON-RPC notification format

## Event Store (`server/src/eventStore.ts`)

### InMemoryEventStore Class
In-memory event storage for MCP session resumability.

#### Methods
- `storeEvent(streamId, message)`: Store JSON-RPC message
  - Returns: Generated event ID
  - Maintains up to 1000 events per session

- `replayEventsAfter(lastEventId, { send })`: Replay events after given ID
  - Used for SSE reconnection with `Last-Event-ID` header
  - Returns: Last event ID after replay

## Entry Points

### Main Entry (`index.ts`)
- CLI executable via `#!/usr/bin/env node`
- Programmatic import via `import { MCPHub } from 'atlantis-core-mcp'`
- Transport selection via environment variable or CLI arg
  - `TRANSPORT=stdio` or `node dist/index.js stdio`: Use stdio transport
  - `TRANSPORT=http` or `node dist/index.js http`: Use HTTP transport (default)
- Port configuration via `PORT` environment variable (default: 8000)

### Server Module (`server/index.ts`)
- Re-exports `MCPHub` from `./src/server`
- Re-exports all types from `./src/models`

## NPM Scripts

### Build & Development
- `npm run build`: Clean and compile TypeScript
- `npm start`: Start server (HTTP mode by default)
- `npm run start:http`: Explicitly start in HTTP mode
- `npm run start:stdio`: Start in stdio mode
- `npm run dev`: Start complete development system (hub + client + agent)
- `npm run hub`: Start only the hub server

### Quality Assurance
- `npm run lint`: Run ESLint
- `npm run lint:fix`: Auto-fix ESLint issues
- `npm run type-check`: TypeScript type checking without emitting
- `npm test`: Run Jest tests
- `npm run test:watch`: Run tests in watch mode
- `npm run test:coverage`: Generate coverage report
- `npm run test:ci`: Run tests in CI mode
- `npm run ci`: Full CI pipeline (lint + type-check + test)

### Utilities
- `npm run clean`: Remove dist and coverage directories

## Helper Scripts

### `scripts/start-hub-system.sh`
Comprehensive system startup script for development.

#### Modes
- `all`: Start hub, client, and agent (default)
- `hub`: Start only the hub server
- `client`: Start only the interactive CLI client
- `agent`: Start only the random agent
- `stop`: Stop all running components
- `status`: Check component status

#### Features
- Dependency checking (Node.js, npm, TypeScript)
- Automatic build before start
- PID file management
- Color-coded output
- Health checks

## Architecture Notes

### Transport Strategy
- **stdio**: For local process communication (Claude CLI integration)
  - Uses `StdioServerTransport` from MCP SDK
  - Server runs as subprocess of client

- **HTTP**: For remote agent communication (custom agents)
  - Uses `StreamableHTTPServerTransport` from MCP SDK
  - Server runs independently, agents connect via HTTP
  - Session-based with SSE for real-time notifications

### Session Lifecycle
1. Client sends initialize request to `POST /mcp`
2. Server creates session, assigns session ID
3. Server responds with `Mcp-Session-Id` header
4. Client uses session ID in all subsequent requests
5. Client can open SSE stream via `GET /mcp` with session ID
6. Session auto-expires after 5 minutes of inactivity
7. Client can explicitly close via `DELETE /mcp`

### Message Flow
1. Agent A calls `send_message` tool via `POST /mcp`
2. Hub validates session and routes message
3. Hub stores message in conversation
4. Hub enqueues message for Agent B
5. Hub sends notification to Agent B via SSE (if connected)
6. Agent B retrieves message via SSE data event

### Error Handling
- All errors logged with structured metadata
- Graceful degradation on transport failures
- Session cleanup on errors
- Circular reference prevention in lifecycle
