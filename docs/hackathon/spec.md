# Rough Draft Specification: Modular AI-Native  Extension Suite on Forge with MCP

## 1. Overview
### Project Title: AI-Native  Modular Suite (AIMS)
### Purpose
This specification outlines a modular, AI-native  extension suite built on Atlassian's Forge platform. The suite extends Atlassian products (e.g., Jira for requisition tracking, Confluence for documentation, and Compass for resource mapping) to provide procurement-focused  capabilities, inspired by flexible systems like Odoo while incorporating AI for predictive insights. It compensates for Atlassian's weaknesses in resource planning and hardware/procurement workflows while leveraging strengths in agile collaboration.

The design emphasizes modularity for future agnosticism: A core app handles central AI logic and storage, with pluggable modules connecting via standardized communications. To ensure interoperability within the Atlassian environment and between modules, the Model Context Protocol (MCP) is utilized as the primary communication standard. MCP, an open-source protocol for secure, two-way AI-to-system interactions, enables AI agents (e.g., Rovo-based) to query and update external/contextual data seamlessly, reducing proprietary dependencies.

### Key Goals
- Forge Compliance: All components built as Forge apps, integrating natively with Atlassian products via manifests, triggers, and APIs.
- Modularity & Agnosticism: Loose coupling via MCP for easy porting to non-Forge frameworks (e.g., AWS Lambda or microservices).
- AI-Native: Leverage Rovo Dev for development and Rovo agents/actions for runtime AI (e.g., procurement forecasts), qualifying for Codegeist bonuses.
- Standardization: MCP for all inter-module and Atlassian-external comms, ensuring secure, context-aware exchanges.
- Scope: MVP for Codegeist – Core + 2-3 modules, focused on procurement (e.g., inventory, vendors).

### Assumptions & Constraints
- Built in Node.js for Forge runtime.
- MCP implementation: Use open-source MCP libraries (e.g., via npm if available in Forge; otherwise, implement basic MCP-compliant endpoints).
- Atlassian Integration: Via standard HTTPS/REST with Forge Invocation Tokens (FIT) for auth; MCP overlays for AI-specific contexts.
- Future Branching: Modules designed with abstract interfaces (e.g., HTTP wrappers) for non-Forge migration.

## 2. Architecture
### High-Level Design
- **Layered Structure**:
  - **Presentation Layer**: Custom UIs in Forge (UI Kit or iframes) embedded in Atlassian products (e.g., Jira dashboards).
  - **Business Logic Layer**: AI agents via Rovo, handling  functions like optimization.
  - **Data Layer**: Forge entity storage (for Atlassian-tied data) + external DB (e.g., PostgreSQL via APIs) for agnostic persistence.
  - **Communication Layer**: MCP for standardized, context-rich exchanges between core/modules and external systems.
- **Modular Breakdown**:
  - **Core App**: Central hub with main Rovo agent and shared database.
  - **Modules**: Independent Forge apps that register with the core via MCP endpoints.
- **Deployment**: Serverless on Forge; modules deploy as companion apps if multi-product.

### Data Flow Example
1. User creates a Jira requisition → Forge trigger in Module 1 notifies core via MCP request (with context like "procurement forecast").
2. Core's Rovo agent processes (e.g., predicts shortages) and responds via MCP.
3. Module updates Jira/Confluence UI with results.

## Phase 1: Core Development (First Half)
### 3. Communication Protocol: MCP
#### Rationale
MCP is selected as the industry-standard for AI-contextual comms, enabling secure, two-way exchanges between AI models (e.g., Rovo agents) and systems. It standardizes payloads for context (e.g., data sources, tools), reducing Forge-specific ties and facilitating agnosticism.

#### MCP Implementation
- **Protocol Basics** (Based on MCP Standard):
  - **Transport**: HTTPS/REST (aligns with Forge web triggers).
  - **Payload Format**: JSON with MCP schema – e.g., { "context": { "type": "procurement", "data": { "jiraIssue": "ID-123" } }, "action": "forecast", "auth": "FIT/JWT" }.
  - **Endpoints**:
    - Core exposes: /mcp/query (POST for AI requests), /mcp/update (POST for pushing contexts).
    - Modules call core endpoints; core can callback via module-registered webhooks.
  - **Security**: Integrate Forge FIT for auth; MCP's built-in token validation (e.g., JWT claims for context scoping).
  - **Error Handling**: Standard MCP codes (e.g., 400 for invalid context) + retries.
- **Atlassian-Specific Adaptations**:
  - Wrap MCP payloads in Forge headers (e.g., x-forge-oauth for API calls).
  - Use triggers for event-driven MCP messages (e.g., Jira event → MCP context to core).
- **Agnosticism**: MCP code in abstract JS classes (e.g., McpClient.send(context)); no hard Forge imports outside wrappers.

### Example MCP Exchange
**Request from Module to Core**:
```
POST /mcp/query
Headers: Authorization: Bearer [FIT]
Body: {
  "mcpVersion": "1.0",
  "contextId": "ctx-001",
  "context": {
    "source": "jira",
    "data": { "issueKey": "PROJ-456", "items": ["partA", "partB"] }
  },
  "request": { "type": "optimizeInventory" }
}
```

**Response from Core**:
```
{
  "responseId": "res-001",
  "result": { "optimizedOrder": { "quantity": 50, "costSavings": 15 } },
  "contextUpdate": { "newData": "updatedForecast" }
}
```

### 4. Integration with Atlassian Environment
- **Forge Manifest**: Core and modules define permissions (e.g., read:issue for Jira) and modules (e.g., jira:issuePanel).
- **Event Handling**: Triggers for Atlassian events; MCP for propagating to core.
- **UI Rendering**: Custom UIs fetch data via MCP-wrapped APIs.
- **Testing**: Use Forge developer site; mock MCP endpoints for unit tests.

### 5. Security and Compliance
- Auth: FIT + MCP JWTs; scope to least privilege.
- Data Residency: Align with Forge (e.g., EU pinning).
- Risks: Follow MCP security guidelines (e.g., validate contexts to prevent injection).

### 6. Development Roadmap (Rough)
- Week 1: Set up Core with MCP server using Rovo Dev.
- Week 2: Build Module 1; test MCP comms.
- Week 3: Add Modules 2-3; integrate Atlassian.
- Week 4: Demo video, install link, submission.

## Phase 1: Core Development (Second Half)
### 3.1 Core App: AI Core Hub
- **Integration with Atlassian**: Manifest declares Jira/Confluence extensions (e.g., custom fields for  metadata). Uses product fetch API for data pulls.
- **Key Features**:
  - Main Rovo Agent: Handles AI tasks (e.g., "Optimize order based on context") using rovo:agent/actions.
  - Database: Forge storage for structured  data (e.g., BOMs, vendors); abstract to allow external swaps.
  - MCP Server: Exposes MCP-compliant endpoints (e.g., /mcp/context/query) for modules to send/receive AI contexts.
- **Development**: Use Rovo Dev to generate agent code (e.g., prompt: "Scaffold MCP-integrated Rovo agent for  predictions").

## Phase 2: Modular Extensions
### Module Template: Plug-and-Play Framework with Collaboration AI Agent
This template defines a standardized structure for all modular extensions, ensuring a seamless plug-and-play experience. Each module inherits this framework, which includes a complete connection setup via MCP and a built-in collaboration AI agent (a lightweight Rovo agent) for module-specific teamwork features (e.g., facilitating user interactions or cross-module syncs). The template promotes consistency: Modules auto-register with the core on install, use MCP for all comms, and leverage the collaboration agent for AI-enhanced collaboration without duplicating core logic.

#### What the Template Provides
- **Connection Framework**: MCP-based registration and communication handlers for automatic core integration (e.g., handshake on deploy, query/response loops).
- **Collaboration AI Agent**: A Rovo agent embedded in each module for local AI tasks like team coordination (e.g., "Suggest assignees based on Confluence context") or escalating to core for complex ops.
- **Plug-and-Play Mechanics**: Abstract classes for UI, triggers, and data access; config files for module-specific Atlassian integrations.

#### How to Build/Use the Template
- **Forge Setup**: Scaffold as a base Forge app; manifest includes rovo:agent for collaboration, web triggers for MCP callbacks.
- **Code Structure**: Template repo with mcpConnector.js for connections, collabAgent.js for Rovo handlers (generated via Rovo Dev), and extension points for domain logic.
- **Instantiation**: For a new module, extend the template (e.g., copy scaffold, override domain funcs); auto-registers via MCP POST /mcp/register on first run.
- **Rovo Integration**: Local agent actions link to core via MCP for orchestration.
- **Testing/Deployment**: Template includes mocks for core; deploy independently, ensuring plug-in compatibility.

### 3.2 Modular Apps (Examples)
- **Module 1: Inventory Optimizer**
  - **Integration**: Forge trigger on Jira issue events; UI extension in Jira for inventory views.
  - **Comms**: Sends MCP requests to core (e.g., payload with context like Jira backlog data) for AI optimization; receives responses to update local state.
- **Module 2: Vendor Management**
  - **Integration**: Macro in Confluence for vendor scoring; web trigger for external  syncs.
  - **Comms**: Uses MCP to query core agent (e.g., "Score vendors with context: historical performance").
- **Module 3: Budget Tracker (Optional)**
  - **Integration**: Compass component for financial simulations.
  - **Comms**: Bidirectional MCP for real-time budget updates.

### Extensibility
- New modules register with core via MCP "handshake" endpoint (e.g., POST /mcp/register with module ID and capabilities).