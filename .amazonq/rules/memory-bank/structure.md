# Project Structure and Architecture

## Directory Organization

### Root Structure
```
atlantis/
├── docs/                          # Comprehensive documentation
├── src/                           # Source code (layered architecture)
├── coverage/                      # Test coverage reports
├── .amazonq/rules/memory-bank/    # AI assistant memory bank
├── manifest.yml                   # Forge app configuration
├── package.json                   # Node.js dependencies
└── tsconfig.json                  # TypeScript configuration
```

### Source Code Architecture (`src/`)
```
src/
├── index.ts                       # Main entry point, resolver exports
├── types/                         # Shared TypeScript definitions
│   ├── mcp.ts                     # MCP protocol types
│   ├── domain.ts                  # Domain entity types
│   └── api.ts                     # API response types
├── domain/                        # Business logic layer (DDD)
│   ├── entities/                  # Domain entities
│   ├── services/                  # Business logic services
│   └── value-objects/             # Value objects
├── resolvers/                     # Presentation layer
│   ├── mcp/                       # MCP endpoint resolvers
│   ├── rovo/                      # Rovo agent resolvers
│   └── validation/                # Input validation
├── infrastructure/                # Infrastructure layer
│   ├── mcp/                       # MCP server/client implementation
│   ├── storage/                   # Storage implementations
│   ├── atlassian/                 # Jira/Confluence API clients
│   └── config/                    # Configuration & DI
├── frontend/                      # UI layer (Forge UI Kit)
│   ├── components/                # React components
│   └── hooks/                     # Custom React hooks
└── shared/                        # Shared utilities
    ├── errors/                    # Custom error types
    └── utils/                     # Utility functions
```

## Core Components

### MCP Communication Layer (`infrastructure/mcp/`)
- **server.ts**: MCP server implementation for receiving module requests
- **client.ts**: MCP client for communicating with external modules
- **auth.ts**: Forge Invocation Token authentication
- **validation.ts**: MCP protocol validation and type checking

### Storage Architecture (`infrastructure/storage/`)
- **Forge Custom Entities**: Structured data with indexing
  - `erp-context`: AI context and embeddings storage
  - `module-registration`: Dynamic module registry
  - `prediction-cache`: AI prediction caching
- **Forge KVS**: Simple key-value storage for configuration

### Type System (`types/`)
- **mcp.ts**: Complete MCP protocol type definitions
- **domain.ts**: Business domain entity types
- **api.ts**: API request/response interfaces

## Architectural Patterns

### Three-Layer System Design
1. **Core App**: Central AI orchestrator with Rovo agent, MCP server, shared storage
2. **Module Template**: Reusable framework with MCP connector and local AI agent
3. **Pluggable Modules**: Independent Forge apps (Inventory Optimizer, Vendor Management)

### Domain-Driven Design (DDD)
- **Domain Layer**: Pure business logic, framework-agnostic
- **Resolvers**: Coordinate domain services, handle requests/responses
- **Infrastructure**: External integrations (Jira API, storage, MCP)
- **Frontend**: Forge UI Kit components and React hooks

### Communication Flow
```
Module → MCP Client → HTTPS/REST → Core MCP Server → Rovo Agent → AI Processing → Response
```

## Key Relationships

### Module Registration
- Modules register capabilities via `POST /mcp/register`
- Core maintains registry in `module-registration` entity
- Dynamic discovery and capability matching

### Context Management
- AI context stored in `erp-context` entity with embeddings
- Context propagation through MCP protocol
- Intelligent context sharing between modules

### Storage Compliance
- **Forge-hosted only**: No external databases
- **Custom Entities**: Structured data with indexes
- **AI Embeddings**: Vector arrays in entity attributes
- **Caching Strategy**: Prediction cache with expiration

## Testing Structure
- **Co-located tests**: `__tests__/` directories alongside source
- **Layer-specific testing**: Unit tests for each architectural layer
- **Integration tests**: MCP communication and storage operations
- **Coverage tracking**: 82%+ statement coverage maintained

## Configuration Management
- **manifest.yml**: Forge app configuration with entities and permissions
- **package.json**: Dependencies and build scripts
- **tsconfig.json**: TypeScript strict mode configuration
- **eslint.config.js**: Code quality and style enforcement