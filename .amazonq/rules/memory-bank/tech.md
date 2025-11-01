# Atlantis Core - Technology Stack

## Programming Languages
- **TypeScript 5.9.3**: Primary language with strict type checking
- **JavaScript**: Runtime execution via Node.js
- **YAML**: Configuration files (manifest.yml, CI/CD)

## Core Dependencies

### MCP Framework
- **@modelcontextprotocol/sdk ^1.20.2**: Official Model Context Protocol SDK
- **zod ^3.23.8**: Runtime type validation and schema parsing

### Web Framework
- **express ^5.1.0**: HTTP server for A2A protocol and API endpoints

### Development Tools
- **@typescript-eslint/eslint-plugin ^8.46.2**: TypeScript-specific linting rules
- **@typescript-eslint/parser ^8.46.2**: TypeScript AST parser for ESLint
- **eslint ^9.38.0**: Code quality and style enforcement

### Testing Framework
- **jest**: Unit testing framework with coverage reporting
- **@jest/globals ^30.2.0**: Jest global functions and utilities
- **@types/jest ^30.0.0**: TypeScript definitions for Jest

## Build System

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "CommonJS",
    "outDir": "./dist"
  }
}
```

### Build Commands
- **npm run build**: Clean and compile TypeScript to dist/
- **npm run type-check**: Type checking without compilation
- **npm run clean**: Remove dist/ and coverage/ directories

### Quality Assurance
- **npm run lint**: ESLint code analysis
- **npm run lint:fix**: Automatic lint fixes
- **npm run test**: Jest unit tests
- **npm run test:coverage**: Coverage reporting
- **npm run ci**: Full CI pipeline (lint + type-check + test)

## Runtime Environment

### Node.js Runtime
- **nodejs22.x**: Forge app runtime environment
- **arm64**: Target architecture for deployment
- **256MB**: Memory allocation for Forge app

### Package Management
- **npm**: Package manager with lock file for reproducible builds
- **package-lock.json**: Dependency version locking

## Atlassian Platform

### Forge Framework
- **Forge App**: Native Atlassian cloud app platform
- **Storage Entities**: Persistent data storage with indexing
- **Rovo Agent**: AI agent integration framework
- **Action Framework**: Custom actions for AI workflows

### Storage Configuration
```yaml
storage:
  entities:
    - erp-context: Context storage with embeddings
    - module-registration: Dynamic module tracking  
    - prediction-cache: AI prediction caching
```

### Permissions
- **storage:app**: Application-level storage access
- **external.fetch.backend**: External API communication

## Development Workflow

### Local Development
```bash
npm install          # Install dependencies
npm run type-check   # Validate TypeScript
npm run lint         # Check code quality
npm run test         # Run unit tests
npm run build        # Compile to dist/
```

### Server Operations
```bash
npm start            # Start MCP server
npm run registry     # Start module registry
npm run logs         # Start log server
npm run start:all    # Start all services
```

### Testing Strategy
- **Unit Tests**: Jest with co-located test files
- **Type Safety**: TypeScript strict mode
- **Code Quality**: ESLint with TypeScript rules
- **Coverage**: Jest coverage reporting

## Protocol Support

### Current Protocols
- **MCP (Model Context Protocol)**: Primary protocol for Rovo Dev integration
- **HTTP/Express**: REST API endpoints for health checks and queries

### Planned Protocols
- **A2A (Agent-to-Agent)**: External agent communication protocol
- **WebSocket**: Real-time streaming for agent interactions

## Deployment

### Build Artifacts
- **dist/index.js**: Main server executable
- **Binary**: atlantis-mcp CLI command
- **Package**: npm publishable package

### Environment
- **Atlassian Cloud**: Forge app deployment target
- **MCP Client**: Integration with Rovo Dev
- **External Access**: Controlled through Atlantis Core