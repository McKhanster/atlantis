# Atlantis Core Function Inventory

## Entry Points

### `src/index.ts`
- **main()**: Main entry point, creates and starts AtlantisMcpServer

## Infrastructure Layer

### Core Modules (`src/infrastructure/`)

#### `session-data.ts`
- **SessionData.getInstance()**: Singleton pattern for session data management
- **getSessions()**: Returns sessions map
- **setSessions(sessions)**: Sets sessions map
- **getSession(key)**: Gets session by key
- **setSession(key, value)**: Sets session value
- **hasSession(key)**: Checks if session exists
- **deleteSession(key)**: Deletes session by key
- **clearSessions()**: Clears all sessions

#### `chat.ts`
- **Chat.getInstance()**: Singleton pattern for chat data management
- **getChats()**: Returns chats map
- **setChats(chats)**: Sets chats map
- **getChat(key)**: Gets chat by key
- **setChat(key, value)**: Sets chat value
- **hasChat(key)**: Checks if chat exists
- **deleteChat(key)**: Deletes chat by key
- **clearChats()**: Clears all chats

### MCP Communication (`src/infrastructure/mcp/`)

#### `auth.ts`
- **validateForgeInvocationToken(token: string)**: Validates Forge Invocation Token (FIT) and returns AuthContext
- **hasScope(context: AuthContext, requiredScope: string)**: Checks if auth context has required scope
- **assertScope(context: AuthContext, requiredScope: string)**: Throws MCPError if scope is missing
- **generateMockFIT(config)**: Generates mock FIT token for testing
- **encodeBase64Url(str: string)**: Base64 URL-safe encoding helper
- **decodeBase64Url(str: string)**: Base64 URL-safe decoding helper

#### `central-logger.ts`
- **CentralLogger.getInstance()**: Singleton pattern for central logger
- **logInteraction(type: string, data: Record<string, unknown>)**: Logs interaction to central log server
- **CentralLogger.logInteraction()**: Static method for logging interactions

#### `client.ts`
- **McpForgeClient.register()**: Registers module with Core server
- **McpForgeClient.sendRequest(type, context, params)**: Sends MCP request to Core server
- **McpForgeClient.query(context, params)**: Queries Core for AI insights
- **McpForgeClient.update(context, params)**: Updates context in Core
- **McpForgeClient.isRegistered()**: Checks if module is registered
- **McpForgeClient.sendMCPRequest(request)**: Sends MCP request over HTTP and validates response
- **McpForgeClient.sendHttpRequest(url, body)**: Generic HTTP request helper
- **createMcpClient(config)**: Creates MCP client instance

#### `http-registry.ts`
- **HttpModuleRegistry.getModules()**: Gets modules from HTTP API
- **HttpModuleRegistry.addModule(module)**: Adds module via HTTP API
- **HttpModuleRegistry.removeModule(moduleId)**: Removes module via HTTP API

#### `mcp-server.ts`
- **AtlantisMcpServer.start()**: Starts stdio server (default)
- **AtlantisMcpServer.startStdio()**: Starts MCP server with stdio transport
- **AtlantisMcpServer.startHttp(port)**: Starts MCP server with HTTP transport
- **AtlantisMcpServer.getServer()**: Returns underlying MCP server instance

#### `shared-registry.ts`
- **SharedModuleRegistry.getModules()**: Gets modules from file-based registry
- **SharedModuleRegistry.addModule(module)**: Adds module to file-based registry
- **SharedModuleRegistry.removeModule(moduleId)**: Removes module from file-based registry

#### `validation.ts`
- **validateCallToolRequest(obj)**: Validates CallToolRequest format
- **validateCallToolResult(obj)**: Validates CallToolResult format
- **validateModuleRegistration(obj)**: Validates module registration request
- **validateWithSchema(schema, obj, errorMessage)**: Generic validation helper
- **assertValidCallToolRequest(obj)**: Throws MCPError if validation fails
- **assertValidCallToolResult(obj)**: Throws MCPError if validation fails

### Tools (`src/infrastructure/tools/`)

#### `base-tool.ts`
- **BaseTool.logInteraction(type, data)**: Logs tool interaction
- **BaseTool.incrementCallCount()**: Increments tool call counter
- **BaseTool.createMCPResponse(requestId, result, request, processingStartTime)**: Creates standardized CallToolResult
- **BaseTool.getBaseStatus()**: Returns tool status information

#### `health-check-tool.ts`
- **HealthCheckTool.getInstance()**: Singleton pattern for health check tool
- **HealthCheckTool.execute(requestId, data, req)**: Executes health check and returns CallToolResult

#### `list-modules-tool.ts`
- **ListModulesTool.getInstance()**: Singleton pattern for list modules tool
- **ListModulesTool.execute(requestId, data)**: Executes module listing and returns CallToolResult

## Shared Utilities (`src/shared/`)

### Error Handling (`src/shared/errors/`)

#### `domain-error.ts`
- **DomainError(message, code)**: Base domain error class
- **ValidationError(message)**: Validation-specific error
- **NotFoundError(message)**: Not found error
- **UnauthorizedError(message)**: Unauthorized access error

#### `mcp-error.ts`
- **MCPError(message, code, details)**: MCP protocol-specific error

## Tools (`src/tools/`)

#### `log-server.ts`
- **main server logic**: HTTP server for aggregating MCP interactions
- **POST /log**: Endpoint for receiving log entries
- **GET /logs**: Endpoint for retrieving all logs

#### `a2a-test-server.ts`
- **main()**: Starts A2A test server with graceful shutdown handling

## Type Definitions (`src/types/`)

#### `api.ts`
- **APIResponse<T>**: Generic API response interface

#### `domain.ts`
- **Context**: Domain context entity interface
- **ModuleRegistration**: Module registration entity interface
- **PredictionCache**: Prediction cache entity interface

#### `mcp.ts`
- **isMCPRequest(obj)**: Type guard for MCP requests
- **isMCPResponse(obj)**: Type guard for MCP responses
- Various MCP protocol type definitions and schemas

## Test Setup (`src/setupTests.ts`)
- **Jest mocks**: Mocks for @forge/api, @forge/bridge, @forge/kvs

### A2A Infrastructure (`src/infrastructure/a2a/`)

#### `agent-card.ts`
- **getAgentCard()**: Returns Atlantis agent card with runtime logging
- **atlantisAgentCard**: Static agent card definition for A2A protocol

#### `task-executor.ts`
- **AtlantisTaskExecutor.execute(context, eventBus)**: Executes A2A tasks with MCP translation
- **AtlantisTaskExecutor.cancelTask(taskId, eventBus)**: Cancels running A2A tasks
- **AtlantisTaskExecutor.simulateTaskExecution()**: Placeholder task execution with progress events

#### `a2a-server.ts`
- **AtlantisA2AServer.start(port)**: Starts basic A2A Express server on specified port
- **AtlantisA2AServer.stop()**: Stops A2A server gracefully
- **AtlantisA2AServer.getStatus()**: Returns server running status and port

#### `index.ts`
- **Exports**: A2A infrastructure components and types

## Summary

**Total Functions**: 69 functions across 22 files
**Architecture**: Layered DDD with Infrastructure, Domain, and Shared layers
**Key Patterns**: Singleton pattern, Factory pattern, Validation pattern
**Protocol Support**: MCP (Model Context Protocol) + A2A (Agent-to-Agent) with Forge integration
**Logging**: Centralized logging with real-time aggregation
**Authentication**: Forge Invocation Token (FIT) validation + A2A token auth
**Storage**: HTTP-based and file-based module registries + A2A task store