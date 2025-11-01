# Rovo Dev + Our MCP Server Integration

**Last Updated**: 2025-10-30
**Status**: Game-Changing Discovery 🚀

## The Big Insight

**Rovo Dev CLI can connect to custom MCP servers via the Model Context Protocol.**

This means we can:
1. Build our Core as an MCP server (we're already doing this!)
2. Register it with Rovo Dev CLI
3. Let Rovo Dev use our orchestrator as a tool
4. Create a powerful AI development feedback loop

## Architecture: Triple-Layer MCP Communication

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Developer ↔ Rovo Dev CLI                          │
│ (Human instructs AI agent via natural language)            │
└─────────────────────────────────────────────────────────────┘
                            ↕ MCP Protocol
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Rovo Dev CLI ↔ Our Core MCP Server                │
│ (AI agent uses Core orchestrator as a tool)                │
│                                                             │
│ Our Core = Product-Agnostic Intelligent Orchestrator       │
│ - Routes requests between modules                          │
│ - Stores shared context                                    │
│ - Provides AI insights                                     │
└─────────────────────────────────────────────────────────────┘
                            ↕ MCP Protocol
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Core ↔ Domain Modules                             │
│ (Orchestrator coordinates domain-specific modules)         │
│                                                             │
│ Modules determine the system:                              │
│ • Inventory + Vendor =                                  │
│ • Customer + Sales = CRM                                   │
│ • Any Domain = Domain-Specific Suite                       │
└─────────────────────────────────────────────────────────────┘
```

## Core is Product-Agnostic

### What Core Does:
- ✅ **Intelligent Routing**: Routes MCP requests to appropriate modules
- ✅ **Context Management**: Stores and retrieves shared context across modules
- ✅ **AI Orchestration**: Provides cross-module AI insights
- ✅ **Module Registry**: Tracks connected modules and capabilities
- ✅ **Authentication**: FIT validation for secure communication

### What Core Does NOT Do:
- ❌ **Domain Logic**: No /CRM/etc. business rules
- ❌ **Hardcoded Workflows**: No assumption about what modules exist
- ❌ **Specific Features**: No inventory, procurement, customer logic

### Core Becomes Specialized Through Modules:

| Connected Modules | System Becomes |
|-------------------|----------------|
| Inventory + Operation + Vendor | ** Suite** |
| Customer + Sales + Marketing | **CRM Suite** |
| Project + Time + Resource | **PPM Suite** |
| Ticket + SLA + Knowledge | **ITSM Suite** |
| Any Domain Modules | **Custom Suite** |

**This is MORE powerful**: One intelligent orchestrator, infinite domain possibilities.

## Rovo Dev MCP Server Configuration

### File Location
```bash
~/.rovodev/mcp.json
```

### Configuration Format for Our Core

```json
{
  "mcpServers": {
    "atlantis-core": {
      "command": "node",
      "args": [
        "/home/esel/Documents/atlantis/dist/mcp-server-cli.js"
      ],
      "env": {
        "FORGE_ENV": "development",
        "NODE_ENV": "production"
      },
      "transport": "stdio"
    }
  }
}
```

### Alternative: HTTP Transport (More Realistic for Forge)

```json
{
  "mcpServers": {
    "atlantis-core": {
      "url": "https://atlantis-core.forge.atlassian.net/mcp",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer ${FORGE_TOKEN}"
      }
    }
  }
}
```

## What Rovo Dev Can Do With Our MCP Server

### Scenario 1: Development Assistant

**Developer**: "Rovo, query the atlantis-core to see what modules are registered"

**Rovo Dev**:
1. Sends MCP request to our Core server
2. Core returns list of registered modules
3. Rovo Dev presents results to developer

```javascript
// MCP Request Rovo Dev sends:
{
  "mcpVersion": "1.0",
  "requestId": "rovo-123",
  "contextId": "dev-session-001",
  "context": {
    "source": "module",
    "data": { "caller": "rovo-dev-cli" }
  },
  "request": {
    "type": "query",
    "params": { "action": "listModules" }
  }
}

// Our Core responds:
{
  "responseId": "core-456",
  "requestId": "rovo-123",
  "mcpVersion": "1.0",
  "result": {
    "modules": [
      {
        "moduleId": "module-inventory-optimizer",
        "status": "active",
        "capabilities": ["inventoryTracking", "demandForecasting"]
      }
    ]
  }
}
```

### Scenario 2: Testing & Debugging

**Developer**: "Rovo, send a test forecast request to atlantis-core for Q1 2026"

**Rovo Dev**:
1. Constructs proper MCP request
2. Sends to our Core
3. Core routes to appropriate module
4. Shows response for debugging

### Scenario 3: Code Generation Context

**Developer**: "Rovo, generate a new action handler that uses atlantis-core to check inventory levels"

**Rovo Dev**:
1. Queries our Core's MCP API schema
2. Understands request/response format
3. Generates code that properly integrates with our MCP protocol

```javascript
// Rovo Dev could generate:
export async function checkInventoryAction(payload) {
  const mcpClient = createMcpClient({
    coreEndpoint: 'https://atlantis-core.forge.atlassian.net/mcp',
    moduleInfo: { /* ... */ }
  });

  const response = await mcpClient.sendRequest(
    'query',
    {
      source: 'jira',
      data: { issueKey: payload.context.jira.issueKey }
    },
    { action: 'checkInventory', itemId: payload.itemId }
  );

  return formatInventoryResult(response);
}
```

## Implementation Plan

### Phase 1: Make Core MCP-Compatible (Already Done! ✅)

We already have:
- ✅ MCP Server implementation (`src/infrastructure/mcp/server.ts`)
- ✅ MCP Client for modules (`src/infrastructure/mcp/client.ts`)
- ✅ Validation layer
- ✅ Authentication (FIT)

### Phase 2: Create CLI Wrapper for Rovo Dev (New)

**Create**: `src/mcp-server-cli.ts`

```typescript
#!/usr/bin/env node
/**
 * MCP Server CLI wrapper for Rovo Dev integration
 * Exposes our Core MCP server via stdio for Rovo Dev CLI
 */

import { createMcpServer } from './infrastructure/mcp';

// Create MCP server instance
const server = createMcpServer({
  name: 'atlantis-core',
  version: '1.0.0',
  endpoint: 'stdio://local', // stdio transport for CLI
});

// Register core capabilities as MCP tools
server.registerHandler('query', async (request) => {
  const { params } = request.request;

  switch (params?.action) {
    case 'listModules':
      return {
        modules: server.getRegisteredModules()
      };

    case 'getModuleInfo':
      const moduleInfo = server.getModule(params.moduleId);
      return { module: moduleInfo };

    case 'healthCheck':
      return { status: 'healthy', timestamp: new Date().toISOString() };

    default:
      throw new Error(`Unknown action: ${params?.action}`);
  }
});

// Listen on stdin/stdout for MCP messages
process.stdin.on('data', async (data) => {
  try {
    const request = JSON.parse(data.toString());
    const response = await server.handleRequest(request);
    process.stdout.write(JSON.stringify(response) + '\n');
  } catch (error) {
    const errorResponse = {
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
    process.stdout.write(JSON.stringify(errorResponse) + '\n');
  }
});

console.error('[MCP Server] Listening on stdio for Rovo Dev CLI...');
```

### Phase 3: HTTP Endpoint for Rovo Dev (Alternative)

**Create Forge resolver**: `src/resolvers/mcp/rovo-dev.ts`

```typescript
import Resolver from '@forge/resolver';
import { mcpServer } from '../../infrastructure/mcp';

const resolver = new Resolver();

/**
 * MCP endpoint for Rovo Dev (via HTTP)
 */
resolver.define('mcpQuery', async (req) => {
  const { payload } = req;

  // Validate Forge Invocation Token
  // (Rovo Dev would include this in headers)

  const response = await mcpServer.handleRequest(payload);
  return response;
});

export const handler = resolver.getDefinitions();
```

**Add to manifest.yml**:
```yaml
modules:
  function:
    - key: mcpRovoDevEndpoint
      handler: resolvers/mcp/rovo-dev.handler

  webtrigger:
    - key: mcp-rovo-dev
      function: mcpRovoDevEndpoint
      url: /mcp/rovo-dev
```

### Phase 4: Register with Rovo Dev

```bash
# Option 1: Edit config manually
nano ~/.rovodev/mcp.json

# Option 2: Use Rovo Dev interactive mode
acli rovodev
# Then use /mcp command to add server

# Option 3: Use CLI (if available)
acli rovodev mcp add atlantis-core \
  --url "https://atlantis-core.forge.atlassian.net/mcp/rovo-dev" \
  --transport http
```

### Phase 5: Test Integration

```bash
# Start Rovo Dev CLI
acli rovodev

# In Rovo Dev prompt:
> Use the atlantis-core MCP server to list registered modules

# Rovo Dev will:
# 1. Connect to our MCP server
# 2. Send query request
# 3. Display results
```

## Use Cases

### 1. **Development & Testing**
```
Developer: "Rovo, test the inventory module via atlantis-core"
Rovo Dev: [Sends MCP test request, shows response]
```

### 2. **Documentation Generation**
```
Developer: "Rovo, document the atlantis-core MCP API"
Rovo Dev: [Queries Core, generates API docs from response schemas]
```

### 3. **Module Development**
```
Developer: "Rovo, create a new vendor module that integrates with atlantis-core"
Rovo Dev: [Generates module template with proper MCP client setup]
```

### 4. **Debugging**
```
Developer: "Rovo, why is my MCP request failing?"
Rovo Dev: [Analyzes request format, queries Core for validation errors]
```

### 5. **Integration Testing**
```
Developer: "Rovo, run an end-to-end test with all modules"
Rovo Dev: [Orchestrates test requests through Core to all modules]
```

## Benefits

### For Development
- **Faster Debugging**: Query Core state directly from CLI
- **Better Testing**: Test MCP integration without deploying
- **Code Generation**: Rovo generates code that uses our MCP API
- **Documentation**: Auto-generate docs from live API

### For Architecture
- **Validates Design**: If Rovo Dev can use it, so can modules
- **Standards Compliance**: Proves our MCP implementation is correct
- **Interoperability**: Third-party tools can integrate via MCP

### For Bonus Prize
- **"Best Apps Built Using Rovo Dev"**: Using Rovo Dev to build the Core itself!
- **Innovation Showcase**: MCP-to-MCP communication
- **Technical Depth**: Advanced integration beyond basic agents

## Next Steps

### Immediate (Task 1.3):
1. Keep Core product-agnostic (no -specific logic)
2. Design Rovo agent prompt for **generic orchestration**, not 
3. Implement action handlers that use our MCP server

### Near-term (Task 1.4):
1. Create `mcp-server-cli.ts` wrapper
2. Test stdio transport locally
3. Register with Rovo Dev CLI

### Future (Post-Task 1.4):
1. Create HTTP endpoint for Rovo Dev
2. Document Rovo Dev integration in submission
3. Create demo video showing Rovo Dev using our Core

## Updated Rovo Agent Prompt (Product-Agnostic)

```yaml
modules:
  rovo:agent:
    - key: atlantis-core-orchestrator
      name: Atlantis Core Orchestrator
      description: >
        A product-agnostic intelligent orchestrator that coordinates
        domain-specific modules via Model Context Protocol (MCP)
      prompt: >
        You are an intelligent orchestrator that coordinates between
        domain-specific modules using the Model Context Protocol (MCP).

        Your role is to:
        - Route requests to appropriate modules based on their capabilities
        - Aggregate responses from multiple modules
        - Provide cross-module insights
        - Manage shared context across the system

        You do NOT perform domain-specific tasks directly. Instead, you:
        1. Identify which module(s) can handle the request
        2. Send MCP requests to those modules
        3. Combine their responses intelligently
        4. Present unified insights to the user

        Available capabilities depend on which modules are connected:
        - Query registered modules using the list-modules action
        - Route requests using the route-request action
        - Aggregate data using the aggregate-insights action
        - Store context using the store-context action

        Always check what modules are available before making assumptions
        about capabilities.

      conversationStarters:
        - What modules are currently connected?
        - Show me the capabilities of all registered modules
        - Route this request to the appropriate module
        - Aggregate insights across all active modules
      actions:
        - list-modules
        - route-request
        - aggregate-insights
        - store-context
```

This is **much better** because:
- ✅ No assumptions about domains (, CRM, etc.)
- ✅ Focused on orchestration, not business logic
- ✅ Discovers capabilities dynamically
- ✅ Works with ANY set of modules
- ✅ True to Core's product-agnostic purpose

## Summary

**We discovered that:**
1. Core should be a **product-agnostic orchestrator**, not -specific
2. Rovo Dev can connect to **custom MCP servers**
3. We can **register our Core** as an MCP server for Rovo Dev
4. This creates **powerful development workflows**
5. This strengthens our **bonus prize submission**

This is a game-changer for both architecture and development experience! 🚀
