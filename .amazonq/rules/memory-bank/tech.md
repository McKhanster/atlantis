# Technology Stack and Development

## Programming Languages and Versions

### Primary Stack
- **TypeScript 5.9.3**: Strict mode enabled, zero `any` types policy
- **Node.js 22.x**: Runtime environment (ARM64 architecture)
- **JavaScript ES2022**: Target compilation for modern features

### Framework and Platform
- **Atlassian Forge**: Native platform integration
- **Forge UI Kit**: React-based UI components
- **Rovo Agent**: AI orchestration and conversation management

## Dependencies

### Production Dependencies
```json
{
  "@modelcontextprotocol/sdk": "^1.20.2"
}
```

### Development Dependencies
```json
{
  "@jest/globals": "^30.2.0",
  "@types/jest": "^30.0.0", 
  "@types/node": "^24.9.2",
  "@typescript-eslint/eslint-plugin": "^8.46.2",
  "@typescript-eslint/parser": "^8.46.2",
  "eslint": "^9.38.0",
  "jest": "^30.2.0",
  "ts-jest": "^29.4.5",
  "typescript": "^5.9.3"
}
```

## Build System and Tools

### Package Scripts
```bash
# Code Quality
npm run lint              # ESLint validation
npm run lint:fix          # Auto-fix linting issues
npm run type-check        # TypeScript compilation check

# Testing
npm run test              # Run all Jest tests
npm run test:watch        # Continuous testing mode
npm run test:coverage     # Generate coverage reports
npm run test:ci           # CI-optimized test run

# Validation
npm run ci                # Complete validation pipeline
npm run clean             # Clean build artifacts
```

### Forge CLI Commands
```bash
# Development
forge lint                                    # Validate manifest and code
forge deploy -e development                   # Deploy to development
forge tunnel                                 # Real-time debugging logs

# Installation
forge install --non-interactive --site <site> --product jira --environment development
forge install --upgrade                      # Upgrade after scope changes

# Monitoring
forge logs -e development --limit 20         # View application logs
forge environments --non-interactive         # Environment information
```

## Configuration Files

### TypeScript Configuration (`tsconfig.json`)
- **Strict Mode**: Enabled for maximum type safety
- **Target**: ES2022 for modern JavaScript features
- **Module**: CommonJS for Node.js compatibility
- **Source Maps**: Enabled for debugging

### ESLint Configuration (`eslint.config.js`)
- **TypeScript ESLint**: Full TypeScript support
- **Strict Rules**: Zero errors, zero warnings policy
- **Custom Rules**: Project-specific code standards

### Jest Configuration (`jest.config.js`)
- **ts-jest**: TypeScript transformation
- **Coverage**: Statement, branch, function, and line coverage
- **Test Environment**: Node.js environment
- **Setup Files**: Custom test setup and globals

## Storage Technology

### Forge Storage Services
- **Forge Custom Entities**: Structured data with indexing
  - Primary storage for business entities
  - Support for complex queries and relationships
  - Built-in indexing for performance optimization

- **Forge Key-Value Store (KVS)**: Simple key-value pairs
  - Configuration and caching
  - Session data and temporary storage
  - High-performance read/write operations

### Data Models
```yaml
# Custom Entities Schema
erp-context:
  attributes: [contextId, source, entityType, data, embeddings, createdAt]
  indexes: [source, entityType, by-source-date]

module-registration:
  attributes: [moduleId, moduleName, capabilities, status, registeredAt]
  indexes: [moduleType, status]

prediction-cache:
  attributes: [predictionId, contextHash, result, confidence, expiresAt]
  indexes: [contextHash, predictionType, by-expiry]
```

## Development Environment

### Runtime Configuration
- **Memory**: 256MB allocated
- **Architecture**: ARM64 for optimal performance
- **Node.js Version**: 22.x LTS

### Quality Gates
- **ESLint**: Zero errors and warnings
- **TypeScript**: Strict compilation with no errors
- **Jest**: 82%+ test coverage maintained
- **Forge Lint**: Manifest validation and compliance

### Development Workflow
1. **Code Changes**: TypeScript with strict typing
2. **Validation**: `npm run ci` (lint + type-check + test)
3. **Deployment**: `forge deploy -e development`
4. **Testing**: `forge tunnel` for real-time debugging
5. **Monitoring**: Coverage reports and log analysis

## Protocol Implementation

### Model Context Protocol (MCP)
- **SDK**: @modelcontextprotocol/sdk for base functionality
- **Custom Implementation**: Forge-specific adaptations
- **Transport**: HTTPS/REST over Forge platform
- **Authentication**: Forge Invocation Tokens (JWT)

### API Standards
- **REST**: RESTful endpoints for MCP communication
- **JSON**: Structured data exchange format
- **Type Safety**: Full TypeScript interfaces for all APIs
- **Validation**: Runtime validation of all inputs and outputs