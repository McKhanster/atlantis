# Phase 1 Implementation Plan: AI-Native ERP Core Development

## Project Overview

**Project Name**: AI-Native ERP Modular Suite (AIMS)

**Codegeist Category**: Apps for Business Teams

**Target Bonus Prizes**:
- Best Rovo Apps ($2,000)
- Best Apps Built Using Rovo Dev ($2,000)
- Best Runs on Atlassian ($2,000)

**Total Potential Prize**: Up to $21,000 (1 category prize + 3 bonus prizes)

---

## Architecture Overview

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                      CORE APP (Hub)                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Main Rovo Orchestrator Agent               │    │
│  │  - Procurement forecasting                         │    │
│  │  - Inventory optimization                          │    │
│  │  - Budget analysis                                 │    │
│  └────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────┐    │
│  │         MCP Server (Communication Layer)           │    │
│  │  - POST /mcp/query                                 │    │
│  │  - POST /mcp/update                                │    │
│  │  - POST /mcp/register                              │    │
│  └────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Storage Abstraction Layer                  │    │
│  │  - Forge KVS/Custom Entities                       │    │
│  │  - Vector DB abstraction (future)                  │    │
│  │  - Module registry                                 │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          ▲
                          │ MCP Protocol
                          │ (FIT Auth)
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                    MODULE TEMPLATE                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  MCP Connector (auto-registration)                  │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Local Collaboration AI Agent (Rovo)                │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Domain Logic Extension Points                      │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        ▼                                    ▼
┌──────────────────┐              ┌──────────────────┐
│   Module 1:      │              │   Module 2:      │
│   Inventory      │              │   Vendor         │
│   Optimizer      │              │   Management     │
│                  │              │                  │
│ Integration:     │              │ Integration:     │
│ - Jira Panel     │              │ - Confluence     │
│ - Custom Fields  │              │   Macro          │
│                  │              │ - Custom Content │
└──────────────────┘              └──────────────────┘
```

### Technology Stack

- **Platform**: Atlassian Forge (Node.js 22.x)
- **Language**: TypeScript (strict mode)
- **Frontend**: Forge UI Kit (@forge/react)
- **AI**: Rovo agents and actions
- **Communication**: MCP (Model Context Protocol) over HTTPS/REST
- **Storage**: Forge KVS/Custom Entities with vector DB abstraction
- **Testing**: Jest with TypeScript support
- **Code Quality**: ESLint
- **Products**: Jira, Confluence

---

## Week 1: Core App Foundation & MCP Server

**Week Objectives**:
- Set up development environment with strict TypeScript, ESLint, and Jest
- Implement MCP communication layer with full type safety
- Create Core Rovo orchestrator agent using Rovo Dev
- Build Forge-hosted storage abstraction (KVS + Custom Entities)
- **Maintain "Runs on Atlassian" compliance throughout**

**Quality Gates**:
- ✅ All tests passing with ≥70% coverage
- ✅ ESLint zero errors, zero `any` types
- ✅ TypeScript strict mode, no compilation errors
- ✅ `forge lint --runs-on-atlassian` passing
- ✅ All deliverables documented

**See `docs/phase1-detailed-tasks.md` for step-by-step subtask breakdowns.**

---

### Task 1.1: Project Setup & Environment (Day 1, ~6-8 hours)

**Overview**: Initialize Forge application with professional development environment including TypeScript strict mode, comprehensive ESLint rules, Jest testing framework, and layered architecture structure.

**Subtasks**:
1. Initialize Forge application (`forge create`)
2. Configure TypeScript with strict mode and all strict checks enabled
3. Configure ESLint with TypeScript plugin and zero-`any` enforcement
4. Configure Jest with ts-jest and Forge module mocks
5. Create layered directory structure (domain, resolvers, infrastructure, frontend, shared)
6. Configure package.json scripts (lint, test, type-check, ci)
7. Update manifest.yml with storage entity placeholders

**Key Deliverables**:
1. ✅ Initialized Forge app with valid manifest
2. ✅ TypeScript configuration with strict mode enabled
3. ✅ ESLint configuration enforcing best practices
4. ✅ Jest testing framework with Forge mocks
5. ✅ Layered project structure following DDD principles
6. ✅ Package scripts for CI/CD workflow
7. ✅ Manifest with storage:app scope and entity schemas

**Project Structure**:
```
atlantis/
├── docs/                          # Documentation
│   └── phase1-implementation-plan.md
├── src/
│   ├── index.ts                   # Main entry point
│   ├── types/                     # Shared type definitions
│   │   ├── index.ts
│   │   ├── mcp.ts                 # MCP protocol types
│   │   ├── domain.ts              # Domain entity types
│   │   └── api.ts                 # API response types
│   ├── domain/                    # Business logic layer
│   │   ├── entities/              # Domain entities
│   │   │   ├── erp-context.ts
│   │   │   ├── module-registration.ts
│   │   │   └── __tests__/
│   │   ├── services/              # Business logic services
│   │   │   ├── orchestration-service.ts
│   │   │   ├── module-registry-service.ts
│   │   │   └── __tests__/
│   │   └── value-objects/         # Value objects
│   ├── resolvers/                 # Presentation layer
│   │   ├── index.ts               # Export all resolvers
│   │   ├── mcp/                   # MCP endpoint resolvers
│   │   │   ├── query-resolver.ts
│   │   │   ├── update-resolver.ts
│   │   │   ├── register-resolver.ts
│   │   │   └── __tests__/
│   │   ├── rovo/                  # Rovo agent resolvers
│   │   │   ├── agent-resolver.ts
│   │   │   └── __tests__/
│   │   └── validation/            # Input validation
│   │       └── mcp-validator.ts
│   ├── infrastructure/            # Infrastructure layer
│   │   ├── storage/               # Storage implementations
│   │   │   ├── forge-storage.ts
│   │   │   ├── storage-abstraction.ts
│   │   │   ├── vector-db-abstraction.ts
│   │   │   └── __tests__/
│   │   ├── mcp/                   # MCP implementation
│   │   │   ├── mcp-server.ts
│   │   │   ├── mcp-client.ts
│   │   │   └── __tests__/
│   │   ├── atlassian/             # Atlassian API clients
│   │   │   ├── jira-client.ts
│   │   │   ├── confluence-client.ts
│   │   │   └── __tests__/
│   │   └── config/                # Configuration & DI
│   │       └── dependencies.ts
│   ├── frontend/                  # UI layer
│   │   ├── index.tsx              # Main entry
│   │   ├── components/            # Reusable components
│   │   ├── hooks/                 # Custom hooks
│   │   └── __tests__/
│   └── shared/                    # Shared utilities
│       ├── errors/                # Custom error types
│       │   ├── mcp-error.ts
│       │   ├── domain-error.ts
│       │   └── __tests__/
│       └── utils/                 # Shared utilities
│           └── logger.ts
├── manifest.yml                   # Forge app manifest
├── package.json
├── tsconfig.json
├── jest.config.js
├── .eslintrc.json
└── README.md
```

**Configuration Files**:

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/__tests__/**"]
}
```

`jest.config.js`:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/__tests__/**',
    '!src/**/*.d.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

`.eslintrc.json`:
```json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "plugins": ["@typescript-eslint"],
  "env": {
    "node": true,
    "es2022": true
  },
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
```

**Commands**:
```bash
# Initialize Forge app
forge create

# Install dependencies
npm install

# Add development dependencies
npm install --save-dev typescript @types/node jest @types/jest ts-jest eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Add npm scripts to package.json
npm run lint        # Run ESLint
npm run test        # Run Jest tests
npm run type-check  # TypeScript compilation check
```

---

### Task 1.2: MCP Communication Layer (Hybrid Approach)

**Objectives**:
- Research MCP libraries compatible with Forge
- Implement custom MCP-compliant endpoints
- Create authentication layer with FIT
- Build abstraction for agnosticism

**MCP Protocol Specification**:

Based on spec.md, implement the following MCP protocol structure:

```typescript
// MCP Request Structure
interface MCPRequest {
  mcpVersion: string;              // "1.0"
  contextId: string;               // Unique context identifier
  context: {
    source: string;                // "jira" | "confluence" | "module"
    data: Record<string, unknown>; // Context-specific data
  };
  request: {
    type: string;                  // Request type (e.g., "optimizeInventory")
    params?: Record<string, unknown>;
  };
}

// MCP Response Structure
interface MCPResponse {
  responseId: string;
  result: Record<string, unknown>;
  contextUpdate?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
  };
}
```

**Implementation Plan**:

1. **Research Phase** (Day 1):
   - Investigate npm MCP packages: `@modelcontextprotocol/sdk`, `mcp-client`, etc.
   - Test compatibility with Forge Node.js 22.x runtime
   - Document findings for Rovo Dev bonus submission

2. **Custom MCP Server** (Days 2-3):
   - Implement `McpServer` class with endpoints:
     - `/mcp/query`: Handle AI context queries
     - `/mcp/update`: Process context updates
     - `/mcp/register`: Module registration handshake
   - Integrate Forge web triggers
   - Implement FIT authentication validation
   - Add request/response logging

3. **MCP Client Abstraction** (Day 3):
   - Create `McpClient` class for modules
   - Implement retry logic and error handling
   - Add request queuing for rate limiting
   - Build mock client for testing

4. **Security Layer** (Day 4):
   - Validate Forge Invocation Tokens
   - Implement scope-based authorization
   - Add request signing for module authentication
   - Security audit and penetration testing prep

**Deliverables**:
- MCP server implementation (`src/infrastructure/mcp/mcp-server.ts`)
- MCP client abstraction (`src/infrastructure/mcp/mcp-client.ts`)
- Type definitions (`src/types/mcp.ts`)
- Unit tests with 80%+ coverage
- Documentation for developers

---

### Task 1.3: Core Rovo Agent Implementation

**Objectives**:
- Define main orchestrator Rovo agent
- Configure agent actions
- Integrate with MCP layer
- Use Rovo Dev for scaffolding

**Rovo Agent Architecture**:

```yaml
# manifest.yml excerpt
modules:
  rovo:agent:
    - key: erp-orchestrator
      name: ERP AI Orchestrator
      description: AI-powered procurement and inventory optimization agent
      function: erp-orchestrator-handler

  action:
    - key: forecast-procurement
      name: Forecast Procurement Needs
      description: Analyze inventory and predict procurement requirements
      function: forecast-procurement-handler

    - key: optimize-inventory
      name: Optimize Inventory Levels
      description: Recommend optimal inventory levels based on usage patterns
      function: optimize-inventory-handler

    - key: analyze-budget
      name: Analyze Budget Impact
      description: Calculate budget implications of procurement decisions
      function: analyze-budget-handler

  function:
    - key: erp-orchestrator-handler
      handler: src/resolvers/rovo/agent-resolver.handler

    - key: forecast-procurement-handler
      handler: src/resolvers/rovo/actions/forecast-handler.handler

    - key: optimize-inventory-handler
      handler: src/resolvers/rovo/actions/optimize-handler.handler

    - key: analyze-budget-handler
      handler: src/resolvers/rovo/actions/budget-handler.handler
```

**Agent Implementation Plan**:

1. **Rovo Dev Scaffolding** (Day 1):
   - Use Rovo Dev to generate initial agent structure
   - Document prompts and iterations for bonus submission
   - Capture screenshots of Rovo Dev workflow
   - Create initial agent prompt templates

2. **Agent Core Logic** (Days 2-3):
   - Implement orchestrator agent resolver
   - Define agent personality and capabilities
   - Create context aggregation logic using Forge Custom Entities
   - Implement decision-making algorithms

3. **Action Handlers** (Days 3-4):
   - Build procurement forecasting action
   - Implement inventory optimization action
   - Create budget analysis action
   - Integrate with domain services

4. **AI Context Storage** (Day 4):
   - Design AI context schema in Forge Custom Entities
   - Store embeddings as arrays in entity attributes
   - Create indexes for efficient context retrieval
   - Implement context caching with Forge KVS
   - **Maintain "Runs on Atlassian" compliance with Forge-only storage**

**Deliverables**:
- Rovo agent resolver (`src/resolvers/rovo/agent-resolver.ts`)
- Action handlers (`src/resolvers/rovo/actions/`)
- Vector DB abstraction (`src/infrastructure/storage/vector-db-abstraction.ts`)
- Rovo Dev documentation with screenshots
- Unit tests for all actions

---

### Task 1.4: Data Storage Architecture

**Objectives**:
- Create storage abstraction layer using Forge-hosted storage ONLY
- Implement Forge Custom Entities for structured data
- Implement Forge KVS for simple key-value storage
- Build core data models
- **CRITICAL**: Use ONLY Forge-hosted storage for "Runs on Atlassian" compliance

**Storage Abstraction Pattern** (All Forge-Hosted):

```typescript
// Storage interface using ONLY Forge-hosted storage
interface IStorageService {
  // Key-Value operations (Forge KVS)
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;

  // Entity operations (Forge Custom Entities)
  query<T>(filter: QueryFilter): Promise<T[]>;
  create<T>(entity: T): Promise<string>;
  update<T>(id: string, entity: Partial<T>): Promise<void>;

  // Advanced query operations
  queryWithIndex<T>(entityType: string, indexName: string, conditions: WhereConditions): Promise<T[]>;
  transaction<T>(operations: TransactionOp[]): Promise<T>;
}

// Forge KVS implementation
class ForgeKVSService {
  // Simple key-value using @forge/kvs
}

// Forge Custom Entities implementation
class ForgeEntityService {
  // Structured data with indexes using @forge/kvs entity()
}

// Unified service combining both
class ForgeStorageService implements IStorageService {
  private kvs: ForgeKVSService;
  private entities: ForgeEntityService;
  // Routes operations to appropriate Forge storage type
}
```

**IMPORTANT**: Vector embeddings for AI context can be stored as arrays in Custom Entities with proper indexing, maintaining "Runs on Atlassian" compliance.

**Core Data Models**:

1. **Module Registration**:
```typescript
interface ModuleRegistration {
  moduleId: string;
  moduleName: string;
  moduleType: 'inventory' | 'vendor' | 'budget' | 'custom';
  capabilities: string[];
  mcpEndpoint: string;
  registeredAt: Date;
  status: 'active' | 'inactive';
  metadata: Record<string, unknown>;
}
```

2. **ERP Context**:
```typescript
interface ERPContext {
  contextId: string;
  source: 'jira' | 'confluence' | 'module';
  entityType: string;
  entityId: string;
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}
```

3. **AI Prediction Cache**:
```typescript
interface PredictionCache {
  predictionId: string;
  contextHash: string;
  predictionType: string;
  result: Record<string, unknown>;
  confidence: number;
  createdAt: Date;
  expiresAt: Date;
}
```

**Implementation Plan**:

1. **Storage Interface** (Day 1):
   - Define `IStorageService` interface (Forge-only)
   - Create type definitions for all entities
   - Document Forge storage requirements and quotas
   - Add `storage:app` scope to manifest

2. **Forge Storage Implementation** (Days 2-3):
   - Implement Forge KVS (`@forge/kvs`) for simple data
   - Implement Forge Custom Entities for structured data with indexes
   - Define custom entity schemas in manifest
   - Add caching layer using Forge KVS
   - Implement error handling and retries

3. **Data Models** (Day 3):
   - Create entity classes with validation matching Forge type requirements
   - Define Custom Entity schemas in manifest.yml
   - Create indexes for common query patterns
   - Implement repository pattern
   - Add data migration utilities

4. **Testing** (Day 4):
   - Unit tests with mock Forge storage
   - Integration tests with actual Forge KVS/Entities
   - Quota management testing
   - Performance benchmarking
   - Verify "Runs on Atlassian" compliance

**Required Manifest Configuration**:
```yaml
app:
  storage:
    entities:
      - key: erp-context
        attributes:
          - name: contextId
            type: string
          - name: source
            type: string
          - name: entityType
            type: string
          - name: entityId
            type: string
          - name: data
            type: any
          - name: createdAt
            type: string
          - name: updatedAt
            type: string
          - name: tags
            type: array
        indexes:
          - key: by-source
            attributes: [source, createdAt]
          - key: by-entity
            attributes: [entityType, entityId]
          - key: by-tags
            attributes: [tags]

      - key: module-registration
        attributes:
          - name: moduleId
            type: string
          - name: moduleName
            type: string
          - name: moduleType
            type: string
          - name: status
            type: string
          - name: registeredAt
            type: string
        indexes:
          - key: by-type
            attributes: [moduleType]
          - key: by-status
            attributes: [status]

permissions:
  scopes:
    - storage:app
```

**Deliverables**:
- Storage abstraction (`src/infrastructure/storage/storage-abstraction.ts`)
- Forge KVS service (`src/infrastructure/storage/forge-kvs.ts`)
- Forge Custom Entities service (`src/infrastructure/storage/forge-entities.ts`)
- Unified storage service (`src/infrastructure/storage/forge-storage.ts`)
- Entity schemas in manifest.yml
- Data models (`src/domain/entities/`)
- Repository services (`src/domain/services/`)
- Comprehensive test suite
- "Runs on Atlassian" compliance documentation

---

## Week 2: Module Template Framework + First Module

### Objectives
- Create reusable module template
- Build Module 1 (Inventory Optimizer)
- Test MCP communication flow
- Integrate with Jira

### Task 2.1: Plug-and-Play Module Template

**Template Structure**:
```
module-template/
├── src/
│   ├── index.ts
│   ├── types/
│   ├── domain/
│   ├── resolvers/
│   ├── infrastructure/
│   │   └── mcp/
│   │       └── connector.ts      # Auto-registration logic
│   ├── frontend/
│   │   └── components/
│   └── rovo/
│       └── collaboration-agent.ts # Local AI agent
├── manifest.yml
├── package.json
└── README.md
```

**Key Features**:
1. **Auto-Registration**: On first run, POST to Core's `/mcp/register`
2. **MCP Connector**: Reusable communication layer
3. **Collaboration Agent**: Lightweight Rovo agent for module-specific tasks
4. **Extension Points**: Abstract classes for domain logic
5. **Testing Utilities**: Mock core, test helpers

**Deliverables**:
- Complete module template
- Developer documentation
- Example implementation
- Testing guide

---

### Task 2.2: Module 1 - Inventory Optimizer

**Target User**: Business teams managing procurement and inventory

**Features**:
1. **Real-time Inventory Dashboard**:
   - Current stock levels
   - Reorder points
   - Lead time tracking
   - Supplier information

2. **AI-Powered Predictions**:
   - Demand forecasting
   - Optimal reorder quantities
   - Budget impact analysis
   - Supplier recommendations

3. **Jira Integration**:
   - Custom fields for inventory metadata
   - Issue panel showing inventory status
   - Automated issue creation for reorders
   - JQL functions for inventory queries

**Technical Implementation**:

```yaml
# Module manifest.yml
modules:
  jira:customField:
    - key: inventory-metadata
      name: Inventory Details
      type: text
      function: inventory-field-handler

  jira:issuePanel:
    - key: inventory-panel
      title: Inventory Status
      url: /inventory-panel
      resolver:
        function: inventory-resolver
      render: native

  jira:jqlFunction:
    - key: needsReorder
      displayName: needsReorder()
      description: Find items that need reordering
      function: needs-reorder-jql
```

**UI Components** (Forge UI Kit):
- DynamicTable for inventory listing
- Charts (LineChart, BarChart) for trends
- SectionMessage for alerts
- ProgressBar for stock levels
- Form components for data entry

**MCP Communication Flow**:
```
User views Jira issue
    ↓
Module queries local inventory data
    ↓
Module sends MCP request to Core:
  {
    context: { source: "jira", data: { issueKey, items } },
    request: { type: "optimizeInventory" }
  }
    ↓
Core's Rovo agent analyzes context
    ↓
Core returns recommendations via MCP
    ↓
Module updates UI with AI insights
```

**Deliverables**:
- Module source code
- Jira integration
- AI-powered features
- Unit and integration tests
- User documentation

---

### Task 2.3: Atlassian Product Integration

**Jira Setup**:

1. **Custom Fields**:
   - Inventory ID
   - Stock quantity
   - Reorder point
   - Supplier ID
   - Unit cost
   - Lead time (days)

2. **Issue Triggers**:
   - Issue created → Check if inventory item
   - Issue updated → Update inventory cache
   - Issue transitioned → Trigger reorder workflow

3. **JQL Functions**:
   - `needsReorder()` - Items below reorder point
   - `inventoryBySupplier(supplierId)` - Items from specific supplier
   - `lowStock()` - Items in critical stock levels

4. **OAuth Scopes**:
```yaml
permissions:
  scopes:
    - read:jira-work
    - write:jira-work
    - read:jira-user
    - read:field:jira
    - write:field:jira
```

**Testing Strategy**:
1. Create test Jira instance
2. Import sample inventory data
3. Test all CRUD operations
4. Validate MCP flows
5. Performance testing with 1000+ issues

**Deliverables**:
- Configured Jira instance
- Sample data sets
- Integration tests
- Performance benchmarks

---

## Week 3: Second Module + Cross-Module Features

### Task 3.1: Module 2 - Vendor Management

**Target User**: Procurement teams managing vendor relationships

**Features**:
1. **Vendor Performance Tracking**
2. **AI-Driven Vendor Scoring**
3. **Contract Management**
4. **Confluence Integration**

**Confluence Setup**:
- Custom content type for vendor profiles
- Macro for vendor comparison tables
- Page templates for vendor documentation

**Deliverables**:
- Module source code
- Confluence integration
- AI vendor scoring
- Test suite

---

### Task 3.2: Inter-Module Communication

**Scenario**: Inventory module triggers vendor assessment
- Low stock detected
- Module 1 requests vendor recommendations from Core
- Core orchestrates Module 2 for vendor scoring
- Consolidated response back to Module 1

**Deliverables**:
- Cross-module communication patterns
- Integration tests
- Demo workflow

---

### Task 3.3: Runs on Atlassian Compliance

**Requirements Checklist**:
- [ ] Performance: < 3s load time
- [ ] Security: Scope minimization, FIT validation
- [ ] UX: Atlassian design system compliance
- [ ] Reliability: Error handling, graceful degradation
- [ ] Documentation: User guides, API docs

**Deliverables**:
- Compliance documentation
- Performance optimizations
- Security audit report

---

## Week 4: Polish, Testing & Submission

### Task 4.1: AI Enhancement & Rovo Dev Documentation

**AI Refinement**:
- Fine-tune agent prompts
- Improve prediction accuracy
- Add confidence scores
- Implement feedback loop

**Rovo Dev Documentation**:
- Screenshot gallery of Rovo Dev usage
- Blog post about development experience
- Social media post (LinkedIn/Twitter)
- Video walkthrough (optional)

---

### Task 4.2: Testing & Quality Assurance

**Testing Checklist**:
- [ ] Unit tests: 80%+ coverage
- [ ] Integration tests: All MCP flows
- [ ] E2E tests: User workflows
- [ ] Performance tests: Load and stress
- [ ] Security tests: Penetration testing
- [ ] Accessibility tests: WCAG compliance

---

### Task 4.3: Demo Video & Submission Materials

**Demo Video Script** (3-5 minutes):
1. **Introduction** (30s): Problem statement for business teams
2. **Core Overview** (60s): AI orchestrator, MCP architecture
3. **Module 1 Demo** (90s): Inventory optimization workflow
4. **Module 2 Demo** (60s): Vendor management integration
5. **Modularity Showcase** (30s): Plug-and-play capability
6. **Developer View** (30s): MCP communication, code quality

**Submission Materials**:
- Devpost project page
- Installation link
- Demo video (YouTube/Vimeo)
- Technical write-ups for 3 bonus prizes
- README and documentation
- Source code repository

---

### Task 4.4: Deployment & Installation Testing

**Deployment Checklist**:
- [ ] Deploy to Forge development environment
- [ ] Create installation link
- [ ] Test on fresh Atlassian Cloud instance
- [ ] Verify all permissions
- [ ] Test all user workflows
- [ ] Performance validation
- [ ] Security scan

---

## Success Criteria

### MVP Requirements
✅ Core App with Rovo orchestrator agent
✅ MCP server with 3 endpoints
✅ Module Template framework
✅ Module 1 (Inventory Optimizer)
✅ Module 2 (Vendor Management)
✅ Jira and Confluence integration
✅ Demo video < 5 minutes
✅ Installation link for judges

### Bonus Prize Requirements
✅ **Best Rovo Apps**: Uses rovo:agent and action modules
✅ **Best Apps Built Using Rovo Dev**: Documentation + social post
✅ **Best Runs on Atlassian**: Meets all program requirements

### Technical Excellence
✅ TypeScript with strict mode
✅ 80%+ test coverage
✅ ESLint zero errors
✅ < 3s page load time
✅ Secure by design (FIT, scope minimization)
✅ Modular and maintainable architecture

---

## Risk Mitigation Strategies

### Technical Risks

1. **MCP Library Compatibility**:
   - **Risk**: npm MCP libraries may not work in Forge runtime
   - **Mitigation**: Hybrid approach with custom fallback
   - **Contingency**: Fully custom MCP implementation

2. **Rovo Agent Limitations**:
   - **Risk**: Rovo may have constraints on agent capabilities
   - **Mitigation**: Start simple, iterate based on capabilities
   - **Contingency**: Enhance with external AI APIs if needed

3. **AI Context Storage Complexity**:
   - **Risk**: Storing complex AI context and embeddings may be challenging
   - **Mitigation**: Use Forge Custom Entities with array attributes for embeddings
   - **Contingency**: Simplify AI context structure, use KVS for caching only
   - **Note**: External vector DB would disqualify from "Runs on Atlassian" bonus

4. **Performance at Scale**:
   - **Risk**: App may slow down with large datasets
   - **Mitigation**: Implement caching, pagination, lazy loading
   - **Contingency**: Add performance disclaimer for MVP

### Timeline Risks

1. **Week 1 Overrun**:
   - **Mitigation**: Prioritize Core + MCP over advanced features
   - **Contingency**: Simplify storage abstraction

2. **Week 2 Module Delays**:
   - **Mitigation**: Template first, then Module 1
   - **Contingency**: Make Module 2 optional for MVP

3. **Week 3 Integration Issues**:
   - **Mitigation**: Daily integration tests
   - **Contingency**: Reduce cross-module features

4. **Week 4 Submission Crunch**:
   - **Mitigation**: Start documentation and video early
   - **Contingency**: Pre-record demo segments throughout development

### Competition Risks

1. **Codegeist Rule Changes**:
   - **Mitigation**: Monitor competition updates daily
   - **Contingency**: Flexible architecture allows pivots

2. **Bonus Prize Competition**:
   - **Mitigation**: Excellent documentation and unique approach
   - **Contingency**: Focus on core category if bonuses unlikely

3. **Judge Perspective**:
   - **Mitigation**: Clear business value demonstration
   - **Contingency**: Emphasize technical innovation if business case unclear

---

## Post-MVP Roadmap (Future Phases)

### Phase 2: Enhanced Modules (Week 5-8)
- Module 3: Budget Tracker
- Module 4: Purchase Order Automation
- Advanced analytics and reporting
- Mobile app support

### Phase 3: External Integrations (Week 9-12)
- ERP system connectors (SAP, Oracle)
- External vector database integration
- Third-party procurement APIs
- Advanced AI models (GPT-4, Claude)

### Phase 4: Marketplace Preparation (Week 13-16)
- Production hardening
- Security audit and penetration testing
- Performance optimization
- Multi-tenant architecture
- Atlassian Marketplace listing

---

## Resources

### Documentation
- Forge Developer Docs: https://developer.atlassian.com/platform/forge/
- Rovo Documentation: https://developer.atlassian.com/platform/forge/example-apps-rovo/
- MCP Specification: https://modelcontextprotocol.io/
- Codegeist Rules: https://codegeistxawr.devpost.com/rules

### Support
- Atlassian Developer Community: https://community.developer.atlassian.com/
- Tag: #codegeist-2025
- Email: support@devpost.com

### Tools
- Forge CLI: https://developer.atlassian.com/platform/forge/cli-reference/
- Rovo Dev: (Access via Atlassian Cloud)
- Node.js 22.x: https://nodejs.org/

---

## Appendix A: MCP Protocol Examples

### Example 1: Inventory Optimization Request
```json
POST /mcp/query
Authorization: Bearer [FIT]

{
  "mcpVersion": "1.0",
  "contextId": "ctx-inv-001",
  "context": {
    "source": "jira",
    "data": {
      "issueKey": "PROJ-456",
      "items": [
        {
          "id": "item-001",
          "name": "Widget A",
          "currentStock": 15,
          "reorderPoint": 25,
          "avgUsage": 5,
          "supplierId": "sup-123"
        }
      ]
    }
  },
  "request": {
    "type": "optimizeInventory",
    "params": {
      "timeHorizon": "30days",
      "budgetConstraint": 10000
    }
  }
}
```

### Example 2: Vendor Scoring Request
```json
POST /mcp/query
Authorization: Bearer [FIT]

{
  "mcpVersion": "1.0",
  "contextId": "ctx-vendor-001",
  "context": {
    "source": "confluence",
    "data": {
      "vendorId": "sup-123",
      "historicalOrders": [...],
      "performanceMetrics": {...}
    }
  },
  "request": {
    "type": "scoreVendor",
    "params": {
      "criteria": ["price", "quality", "delivery", "reliability"]
    }
  }
}
```

---

## Appendix B: Data Model Schemas

### Module Registration Schema
```typescript
{
  "moduleId": "module-inventory-optimizer",
  "moduleName": "Inventory Optimizer",
  "moduleType": "inventory",
  "capabilities": [
    "inventoryTracking",
    "demandForecasting",
    "reorderOptimization"
  ],
  "mcpEndpoint": "https://module-inv.forge.atlassian.net/mcp",
  "registeredAt": "2025-10-29T10:00:00Z",
  "status": "active",
  "metadata": {
    "version": "1.0.0",
    "developer": "AIMS Team",
    "supportContact": "support@aims.example"
  }
}
```

### ERP Context Schema
```typescript
{
  "contextId": "ctx-erp-001",
  "source": "jira",
  "entityType": "issue",
  "entityId": "PROJ-456",
  "data": {
    "inventoryItems": [...],
    "budgetInfo": {...},
    "vendorData": {...}
  },
  "createdAt": "2025-10-29T10:00:00Z",
  "updatedAt": "2025-10-29T10:30:00Z",
  "tags": ["procurement", "urgent", "budget-approved"]
}
```

---

**Document Version**: 1.0
**Last Updated**: October 29, 2025
**Author**: AIMS Development Team
**Status**: Approved for Implementation
