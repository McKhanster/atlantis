# Atlantis Core - Project Structure

## Root Directory Organization

### Configuration & Build
- **package.json**: Main project configuration with MCP SDK dependencies and build scripts
- **tsconfig.json**: TypeScript configuration for strict type checking
- **eslint.config.js**: Code quality and linting rules
- **jest.config.js**: Testing framework configuration
- **manifest.yml**: Forge app manifest defining modules, actions, and storage entities

### Source Code Structure
```
src/
├── infrastructure/          # Core infrastructure components
│   ├── mcp/                # MCP protocol implementation
│   ├── atlassian/          # Atlassian-specific integrations
│   ├── storage/            # Data persistence layer
│   ├── config/             # Configuration management
│   └── tools/              # MCP tool implementations
├── shared/                 # Shared utilities and errors
├── types/                  # TypeScript type definitions
├── tools/                  # Standalone tool servers
└── function-inventory.md   # Centralized function registry
```

### Client & Documentation
- **client/**: Separate MCP client implementation with its own package.json
- **docs/**: Comprehensive documentation including implementation plans and guides
- **scripts/**: Deployment and configuration scripts

## Core Components

### MCP Infrastructure (`src/infrastructure/mcp/`)
- **mcp-server.ts**: Main MCP server implementation
- **auth.ts**: Authentication and authorization logic
- **central-logger.ts**: Centralized logging system
- **client.ts**: MCP client for external communication
- **validation.ts**: Request/response validation
- **junction.ts**: Protocol junction and routing
- **shared-registry.ts**: Module and capability registry

### Tool System (`src/infrastructure/tools/`)
- **base-tool.ts**: Abstract base class for all MCP tools
- **health-check-tool.ts**: Server health monitoring
- **list-modules-tool.ts**: Module registry queries

### Type System (`src/types/`)
- **mcp.ts**: MCP protocol type definitions
- **api.ts**: API interface definitions
- **domain.ts**: Domain model types
- **express.d.ts**: Express framework extensions

### Error Handling (`src/shared/errors/`)
- **domain-error.ts**: Domain-specific error types
- **mcp-error.ts**: MCP protocol error handling
- **index.ts**: Unified error exports

## Architectural Patterns

### Modular Design
- **Infrastructure Layer**: Core MCP and Atlassian integrations
- **Tool Layer**: Pluggable MCP tool implementations
- **Type Layer**: Comprehensive TypeScript type safety
- **Shared Layer**: Common utilities and error handling

### Registry Pattern
- **Module Registry**: Dynamic registration of AI capabilities
- **Tool Registry**: MCP tool discovery and execution
- **Function Inventory**: Centralized tracking of all functions

### Protocol Bridge Architecture
```
External Agents ←A2A→ Atlantis Core ←MCP→ Rovo Dev
                         ↓
                    MCP Tools ←Forge→ Atlassian
```

### Storage Entities (Forge)
- **erp-context**: Context storage with embeddings and metadata
- **module-registration**: Dynamic module capability tracking
- **prediction-cache**: AI prediction caching with expiration

## Development Structure

### Testing Organization
- **__tests__/**: Co-located test files with source code
- **setupTests.ts**: Global test configuration
- **jest.config.js**: Testing framework setup

### Build System
- **TypeScript Compilation**: Strict type checking with tsc
- **ESLint**: Code quality enforcement
- **Jest**: Unit testing with coverage
- **npm Scripts**: Automated build, test, and deployment

### Documentation Strategy
- **Implementation Plans**: Detailed phase-by-phase development guides
- **API Documentation**: MCP protocol and tool specifications
- **Integration Guides**: Rovo Dev and Atlassian setup instructions
- **Memory Bank**: Automated project knowledge base