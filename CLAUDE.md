# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AI-Native ERP Modular Suite (AIMS)** - A modular, AI-native Enterprise Resource Planning (ERP) extension suite built on Atlassian's Forge platform for the Codegeist 2025 hackathon.

- **Category**: Apps for Business Teams
- **Target**: Procurement-focused ERP capabilities for business teams (marketing, finance, HR, procurement, etc.)
- **Bonus Prizes**: Best Rovo Apps, Best Apps Built Using Rovo Dev, Best Runs on Atlassian
- **Key Innovation**: Model Context Protocol (MCP) for modular, AI-native communication between core and modules

## Architecture

### Three-Layer System

1. **Core App**: Central AI orchestrator with Rovo agent, MCP server, and shared storage
2. **Module Template**: Reusable framework with MCP connector and local collaboration AI agent
3. **Pluggable Modules**: Independent Forge apps (e.g., Inventory Optimizer, Vendor Management)

### Communication Protocol: MCP (Model Context Protocol)

All inter-module and core-module communication uses MCP over HTTPS/REST:

```typescript
// MCP Request Format
{
  "mcpVersion": "1.0",
  "contextId": "ctx-001",
  "context": {
    "source": "jira" | "confluence" | "module",
    "data": { /* context-specific payload */ }
  },
  "request": {
    "type": "optimizeInventory" | "scoreVendor" | etc,
    "params": { /* optional parameters */ }
  }
}
```

**MCP Endpoints** (Core App):
- `POST /mcp/query` - AI context queries from modules
- `POST /mcp/update` - Context updates from modules
- `POST /mcp/register` - Module registration handshake

**Authentication**: Forge Invocation Tokens (FIT) with JWT claims

### Directory Structure

```
atlantis/
├── docs/                          # All documentation
│   ├── phase1-implementation-plan.md  # Detailed implementation plan
│   ├── spec.md                    # Original specification
│   ├── rules.md                   # Codegeist competition rules
│   └── codegeist.md               # Codegeist resources
├── src/                           # Source code (to be created)
│   ├── index.ts                   # Main entry point, resolver exports
│   ├── types/                     # Shared TypeScript types
│   │   ├── mcp.ts                 # MCP protocol types
│   │   ├── domain.ts              # Domain entity types
│   │   └── api.ts                 # API response types
│   ├── domain/                    # Business logic layer
│   │   ├── entities/              # Domain entities (Wish, ERPContext, etc.)
│   │   ├── services/              # Business logic services
│   │   └── value-objects/         # Value objects
│   ├── resolvers/                 # Presentation layer
│   │   ├── index.ts               # Export all resolvers
│   │   ├── mcp/                   # MCP endpoint resolvers
│   │   ├── rovo/                  # Rovo agent resolvers
│   │   └── validation/            # Input validation
│   ├── infrastructure/            # Infrastructure layer
│   │   ├── storage/               # Storage implementations
│   │   ├── mcp/                   # MCP server/client
│   │   ├── atlassian/             # Jira/Confluence API clients
│   │   └── config/                # Configuration & DI
│   ├── frontend/                  # UI layer (Forge UI Kit)
│   │   ├── index.tsx
│   │   ├── components/
│   │   └── hooks/
│   └── shared/                    # Shared utilities
│       ├── errors/                # Custom error types
│       └── utils/
├── manifest.yml                   # Forge app manifest
└── package.json                   # Node.js dependencies
```

## Development Commands

### Forge CLI Commands

**IMPORTANT**: Always use the `forge` CLI from the app root directory. Check current path with `pwd` first.

```bash
# Pre-deployment checks
forge lint                         # Validate manifest and code structure
npm run ci                         # Run all tests and linting

# Deployment
forge deploy --non-interactive -e development

# Installation (new)
forge install --non-interactive --site https://yoursite.atlassian.net --product jira --environment development

# Installation (upgrade after scope changes)
forge install --non-interactive --upgrade --site https://yoursite.atlassian.net --product jira --environment development

# Debugging
forge tunnel                       # Real-time logs for local development
forge logs -e development --limit 20  # View recent application logs

# Environment info
forge environments --non-interactive
```

### NPM Scripts

```bash
npm install                        # Install dependencies
npm run lint                       # ESLint
npm run lint:fix                   # Auto-fix linting issues
npm run type-check                 # TypeScript compilation check
npm run test                       # Run all Jest tests
npm run test:watch                 # Continuous testing
npm run test:coverage              # Coverage reports
npm run ci                         # Complete validation (lint + type-check + test)
```

## Code Architecture Patterns

### Layered Architecture

Follow the **Domain-Driven Design** layered architecture:

1. **Domain Layer**: Pure business logic, no framework dependencies
2. **Resolvers**: Coordinate domain services, handle requests/responses
3. **Infrastructure**: External integrations (Jira API, storage, MCP)
4. **Frontend**: Forge UI Kit components, React hooks

### Resolver Pattern

**Resolvers must:**
- Use explicit TypeScript types for request/response (NEVER `any` or `unknown`)
- Coordinate domain services, not contain business logic
- Handle errors gracefully with proper logging
- Validate input using shared types

**Example**:
```typescript
import Resolver from '@forge/resolver';

interface WishRequest {
  payload?: {
    title?: string;
    description?: string;
  };
}

interface WishResponse {
  wish: {
    title: string;
    issueKey: string;
    status: string;
  };
}

const resolver = new Resolver();

resolver.define('createWish', async (req: WishRequest): Promise<WishResponse> => {
  const { title, description } = req.payload || {};

  if (!title || !description) {
    throw new Error('Title and description are required');
  }

  const wish = await wishService.createWish(title, description);
  return { wish: { title: wish.title, issueKey: wish.issueKey, status: wish.status } };
});

export const handler = resolver.getDefinitions();
```

### Storage Abstraction

**CRITICAL FOR "RUNS ON ATLASSIAN" COMPLIANCE**: Use ONLY Forge-hosted storage.

Use the `IStorageService` interface for all storage operations:

```typescript
interface IStorageService {
  // Forge KVS operations
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;

  // Forge Custom Entities operations
  query<T>(filter: QueryFilter): Promise<T[]>;
  create<T>(entity: T): Promise<string>;
  update<T>(id: string, entity: Partial<T>): Promise<void>;
  queryWithIndex<T>(entityType: string, indexName: string, conditions: WhereConditions): Promise<T[]>;
  transaction<T>(operations: TransactionOp[]): Promise<T>;
}
```

**Storage Options**:
1. **Forge KVS** (`@forge/kvs`): Simple key-value pairs, caching, configuration
2. **Forge Custom Entities** (`@forge/kvs` entity()): Structured data with indexes and queries
3. **Forge SQL**: For complex relational data (if needed)
4. **NO external databases**: Disqualifies from "Runs on Atlassian" bonus prize

**AI Context Storage**: Store vector embeddings as arrays in Custom Entity attributes with proper indexing.

### MCP Communication

**Modules communicate with Core using MCP**:

1. Module sends MCP request via `McpClient`
2. Core's `McpServer` receives and validates
3. Core's Rovo agent processes with AI
4. Core responds with MCP response
5. Module updates UI/state

**Hybrid Approach**: Use existing npm MCP libraries where compatible, custom implementation for Forge-specific adaptations.

## Forge-Specific Patterns

### Manifest Configuration

**Before modifying `manifest.yml`**:
1. Consult `docs/phase1-implementation-plan.md` for module examples
2. Run `forge lint` after every change
3. If scopes/permissions change, run `forge install --upgrade`

**Key manifest sections**:
- `modules`: Define UI extensions and functions
- `app.storage.entities`: Define Custom Entity schemas with attributes and indexes
- `permissions.scopes`: OAuth 2.0 scopes (always include `storage:app` for storage)
- `permissions.external`: External domains for API calls
- `rovo:agent` and `action`: AI agent configuration

**Storage Manifest Example**:
```yaml
app:
  storage:
    entities:
      - key: erp-context
        attributes:
          - name: contextId
            type: string
          - name: data
            type: any
        indexes:
          - key: by-context
            attributes: [contextId]

permissions:
  scopes:
    - storage:app  # Required for @forge/kvs
```

### Rovo Agent Development

**Use Rovo Dev** for agent scaffolding (required for "Best Apps Built Using Rovo Dev" bonus):
- Document all Rovo Dev prompts and iterations
- Capture screenshots of generation process
- Create social media post about experience

**Agent structure**:
```yaml
modules:
  rovo:agent:
    - key: erp-orchestrator
      name: ERP AI Orchestrator
      function: erp-orchestrator-handler

  action:
    - key: forecast-procurement
      function: forecast-handler
    - key: optimize-inventory
      function: optimize-handler
```

### UI Kit Components

**CRITICAL**: Forge UI Kit components are NOT standard React components.

**Always**:
- Use components from `@forge/react` only
- Verify component props with `search-forge-docs` tool before using
- Use `xcss` for styling with design tokens (NOT `className`)
- Guard arrays with `|| []` before `.map()` to avoid preview errors
- Use `<Label labelFor="id">` separately (most inputs don't have `label` prop)

**Common patterns**:
- Layout: `Stack` (vertical), `Inline` (horizontal), `Box` (container)
- Forms: `Form`, `Textfield`, `Select`, `CheckboxGroup`, `UserPicker`
- Data: `DynamicTable`, Charts (LineChart, BarChart, etc.)
- Feedback: `SectionMessage`, `Lozenge`, `Spinner`, `ProgressBar`

**Never**:
- Leave `Text`, `Heading`, `Button`, or layout components empty
- Use `<Tab>` with props (only text content)
- Nest `<Checkbox>` inside `<CheckboxGroup>` (use `options` prop)
- Use `level` on `<Heading>` (use `size` instead)

### Testing Strategy

**Co-located tests**: Place tests in `__tests__/` folders next to source files.

```
src/
├── domain/
│   └── services/
│       ├── wish-service.ts
│       └── __tests__/
│           └── wish-service.test.ts
```

**Mock Forge modules**:
```typescript
jest.mock('@forge/bridge', () => ({
  invoke: jest.fn(),
}));

jest.mock('@forge/api', () => ({
  fetch: jest.fn(),
}));
```

## MCP Integration Guidelines

### Module Registration

When a module starts, it registers with Core:

```typescript
// POST /mcp/register
{
  "moduleId": "module-inventory-optimizer",
  "moduleName": "Inventory Optimizer",
  "moduleType": "inventory",
  "capabilities": ["inventoryTracking", "demandForecasting"],
  "mcpEndpoint": "https://module.forge.atlassian.net/mcp",
  "metadata": { "version": "1.0.0" }
}
```

### Security

- **Authentication**: All MCP requests require valid Forge Invocation Token (FIT)
- **Authorization**: Validate sender permissions before processing
- **Scope Minimization**: Request only necessary OAuth scopes
- **Error Handling**: Use standard MCP error codes (400, 401, 403, 500)

## Competition Requirements

### Codegeist 2025 Compliance

✅ Built on Forge platform
✅ Integrates with ≥1 Atlassian product (Jira, Confluence)
✅ Installation link for judges
✅ Demo video < 5 minutes
✅ All materials in English
✅ New/rebuilt after October 27, 2025

### Bonus Prize Requirements

**Best Rovo Apps ($2,000)**:
- Use `rovo:agent` and `action` modules
- Demonstrate AI-powered functionality

**Best Apps Built Using Rovo Dev ($2,000)**:
- Document Rovo Dev usage with screenshots
- Create social media post about experience
- Include write-up in submission

**Best Runs on Atlassian ($2,000)**:
- Performance: < 3s page load
- Security: FIT validation, scope minimization
- UX: Atlassian Design System compliance
- Reliability: Error handling, graceful degradation

## Key Architectural Decisions

### Why MCP?

Model Context Protocol (MCP) is an open-source protocol for secure, two-way AI-to-system interactions. It provides:
- **Standardization**: Industry-standard for AI contextual communications
- **Agnosticism**: Reduces Forge-specific dependencies
- **Future-proofing**: Easy migration to non-Forge platforms
- **Security**: Built-in token validation and context scoping

### Why Layered Architecture?

Separation of concerns enables:
- **Testability**: Mock infrastructure, test business logic in isolation
- **Maintainability**: Clear boundaries between layers
- **Agnosticism**: Swap implementations without changing business logic
- **Scalability**: Independent scaling of layers

### Storage: Forge-Hosted Only

**CRITICAL**: For "Runs on Atlassian" compliance, use ONLY Forge-hosted storage:
- **Forge KVS**: Simple key-value storage via `@forge/kvs`
- **Forge Custom Entities**: Structured data with indexes via `@forge/kvs` entity()
- **Forge SQL**: Relational data (if needed)
- **NO external databases**: Remote storage (PostgreSQL, vector DBs, etc.) disqualifies from bonus

**AI Context**: Store embeddings as arrays in Custom Entity attributes with indexes for similarity search.

## Important Constraints

### Forge Runtime Limitations

- **Serverless**: No persistent servers, functions run on-demand
- **Sandboxed**: Restricted access to external resources (use `permissions.external`)
- **Node.js 22.x**: Use compatible npm packages only
- **No native binaries**: Pure JavaScript/TypeScript only

### Codegeist Timeline

- **Submission Deadline**: December 22, 2025 (10:00 am PT)
- **4-Week Sprint**: Week 1 (Core), Week 2 (Module 1), Week 3 (Module 2), Week 4 (Polish)
- **MVP Scope**: Core + Template + 2 Modules minimum

## Resources

- **Implementation Plan**: `docs/phase1-implementation-plan.md` (60+ pages, authoritative)
- **Original Spec**: `docs/spec.md`
- **Competition Rules**: `docs/rules.md`
- **Forge Resources**: `docs/codegeist.md`
- **Forge Knowledge**: Use MCP tools (`mcp__forge-knowledge__*`)
- **Atlassian Community**: https://community.developer.atlassian.com/ (tag: #codegeist-2025)

## Development Workflow

1. **Planning**: Check implementation plan for current week's tasks
2. **Development**: Follow layered architecture, use TypeScript strict mode
3. **Testing**: Write tests in `__tests__/` folders, aim for 80%+ coverage
4. **Validation**: Run `npm run ci` before committing
5. **Deployment**: `forge lint` → `forge deploy` → `forge install`
6. **Debugging**: Use `forge tunnel` for real-time logs

## Critical Success Factors

1. **MCP Implementation**: Core differentiator, must be robust and well-documented
2. **Rovo Dev Documentation**: Required for bonus prize, capture everything
3. **Modularity**: Template must be truly plug-and-play
4. **Business Value**: Clear demonstration of value for business teams
5. **Code Quality**: TypeScript strict, ESLint clean, 80%+ test coverage
6. **Demo Video**: Compelling 3-5 minute narrative showing real-world use case
