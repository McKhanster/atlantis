# Hybrid MCP-A2A Implementation Plan

## Overview
Implement hybrid protocol support in Atlantis Core to enable external agents to work with Rovo Dev through centralized orchestration, logging, and security.

## Architecture

```
External Agent ←A2A→ Atlantis Core ←MCP→ Rovo Dev
                        |
                       MCP→ tools ←Forge→ Atlassian
```

### Key Benefits
- **Rich External Interface**: A2A protocol for external agents with full task capabilities
- **Rovo Dev Integration**: MCP protocol for Rovo Dev (existing constraint)
- **Protocol Translation**: Atlantis Core bridges A2A tasks ↔ MCP tool calls
- **Centralized Orchestration**: All interactions logged and coordinated through Atlantis Core
- **Flexible Tool Access**: Direct MCP tools for atomic operations

## Phase 1: A2A Server Integration (Week 1)

### 1.1 Dependencies
```bash
npm install @a2a-js/sdk express
```

### 1.2 Core Components
- `src/infrastructure/a2a/a2a-server.ts` - A2A server implementation
- `src/infrastructure/a2a/agent-card.ts` - Atlantis agent identity
- `src/infrastructure/a2a/task-executor.ts` - A2A task execution logic
- `src/types/a2a.ts` - A2A type definitions

### 1.3 Agent Card Definition
```typescript
const atlantisAgentCard: AgentCard = {
  name: "Atlantis Core Orchestrator",
  description: "AI-Native orchestrator for Atlassian environments",
  protocolVersion: "0.3.0",
  version: "1.0.0",
  url: "https://atlantis-core.forge.app/",
  skills: [
    { id: "jira-management", name: "Jira Operations", tags: ["jira", "tickets"] },
    { id: "confluence-content", name: "Confluence Content", tags: ["confluence", "docs"] },
    { id: "cross-platform", name: "Cross-Platform Workflows", tags: ["automation"] }
  ],
  capabilities: {
    streaming: true,
    pushNotifications: true,
    stateTransitionHistory: true
  }
};
```

## Phase 2: Protocol Bridge (Week 2)

### 2.1 Protocol Bridge Components
- `src/infrastructure/bridge/a2a-to-mcp-bridge.ts` - A2A task → MCP tool translation
- `src/infrastructure/bridge/mcp-to-a2a-bridge.ts` - MCP results → A2A artifacts
- `src/infrastructure/a2a/task-orchestrator.ts` - A2A task coordination
- `src/infrastructure/mcp/rovo-client.ts` - MCP client for Rovo Dev

### 2.2 Protocol Translation Logic
```typescript
interface ProtocolBridge {
  // Translate A2A tasks to MCP tool sequences
  translateA2AToMCP(task: A2ATask): MCPToolCall[];
  
  // Convert MCP results to A2A artifacts
  convertMCPToA2A(results: MCPResult[]): A2AArtifact[];
  
  // Stream MCP responses as A2A status updates
  streamMCPAsA2A(mcpResults: MCPResult[], eventBus: A2AEventBus): void;
}
```

### 2.3 Logging Integration
- All A2A interactions logged via existing `CentralLogger`
- Bridge operations logged with correlation IDs
- MCP tool calls tagged with originating A2A task ID

## Phase 3: Task Management (Week 3)

### 3.1 Task Store
- `src/infrastructure/storage/task-store.ts` - Persistent task storage
- Use Forge Custom Entities for task persistence
- Support task cancellation and status tracking

### 3.2 Task Executor
```typescript
class AtlantisTaskExecutor implements AgentExecutor {
  async execute(context: RequestContext, eventBus: ExecutionEventBus) {
    // 1. Parse A2A task requirements
    // 2. Map to MCP tool sequence
    // 3. Execute via existing MCP server
    // 4. Stream results back as A2A events
    // 5. Log all interactions
  }
  
  async cancelTask(taskId: string, eventBus: ExecutionEventBus) {
    // Cancel running MCP operations
    // Update task status to 'canceled'
    // Clean up resources
  }
}
```

## Phase 4: Dual Transport Support (Week 4)

### 4.1 Hybrid Server Architecture
- A2A server for external agents
- MCP server for Rovo Dev communication
- Protocol bridge for translation

### 4.2 Server Implementation
```typescript
export class AtlantisHybridServer {
  private a2aServer: A2AExpressApp; // For external agents
  private mcpServer: McpServer; // For Rovo Dev
  private mcpClient: MCPClient; // Client to Rovo Dev
  private protocolBridge: ProtocolBridge;
  
  async start(a2aPort: number) {
    // A2A server for external agents
    await this.startA2A(a2aPort);
    
    // MCP server for internal tools
    await this.startMCP();
    
    // MCP client to communicate with Rovo Dev
    await this.connectToRovo();
  }
}
```

## Phase 5: Security & Authentication (Week 5)

### 5.1 Authentication
- Forge Invocation Tokens for MCP (existing)
- A2A token-based auth for external agents
- No direct external → Rovo communication

### 5.2 Authorization
- Agent capability validation
- Task permission checking
- Atlassian scope enforcement via Rovo Dev

## Phase 6: Testing & Documentation (Week 6)

### 6.1 Test Coverage
- A2A server integration tests
- Protocol bridge unit tests
- End-to-end external agent scenarios
- MCP compatibility regression tests

### 6.2 Documentation
- External agent integration guide
- A2A task examples
- Protocol bridge architecture
- Deployment instructions

## Implementation Priorities

### High Priority
1. A2A server basic functionality
2. Protocol bridge core translation
3. Logging integration
4. Task persistence

### Medium Priority
1. Streaming support
2. Push notifications
3. Advanced task management
4. Performance optimization

### Low Priority
1. Advanced authentication
2. Multi-tenant support
3. Analytics dashboard
4. External agent SDKs

## Success Metrics

- External agents can create Jira tickets via A2A → Atlantis → Rovo (MCP)
- A2A tasks properly translated to MCP tool sequences
- MCP results converted back to A2A artifacts and status updates
- All interactions logged with protocol translation details
- Task cancellation works across protocol boundaries
- No direct external access to Rovo Dev

## Risks & Mitigations

### Risk: Protocol Complexity
**Mitigation**: Start with simple A2A → MCP mappings, expand gradually

### Risk: Performance Impact
**Mitigation**: Async processing, connection pooling, caching

### Risk: Security Gaps
**Mitigation**: All traffic through Atlantis Core, comprehensive logging

### Risk: Protocol Translation Complexity
**Mitigation**: Start with simple A2A task → MCP tool mappings, expand gradually

### Risk: Rovo Dev MCP Limitations
**Mitigation**: Enhance A2A task decomposition to work within MCP constraints

## Deliverables

1. **Week 1**: A2A server with basic task support
2. **Week 2**: Protocol bridge with MCP translation
3. **Week 3**: Task management and persistence
4. **Week 4**: Dual transport hybrid server
5. **Week 5**: Security and authentication
6. **Week 6**: Testing, documentation, deployment

## Next Steps

1. Install A2A SDK dependencies
2. Create basic A2A server structure
3. Define agent card for Atlantis Core
4. Implement simple task executor
5. Test with external A2A client