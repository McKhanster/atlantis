# Atlantis Core - Development Guidelines

## Code Quality Standards

### TypeScript Conventions
- **Strict Type Safety**: All files use strict TypeScript with explicit type annotations
- **Interface Definitions**: Comprehensive interfaces for all data structures (ForgeInvocationToken, AuthContext, MCPRequest)
- **Type Guards**: Runtime type validation using Zod schemas with `safeParse()` pattern
- **Enum Usage**: String enums for constants (MCPErrorCode, MCPSource, MCPRequestType)
- **Generic Types**: Parameterized types for reusable components (`Record<string, unknown>`)

### Documentation Standards
- **JSDoc Headers**: Every file starts with comprehensive JSDoc describing purpose and context
- **Function Documentation**: All public functions have JSDoc with @param and @returns
- **Inline Comments**: Complex logic explained with inline comments
- **Architecture Notes**: Comments explaining compliance requirements (e.g., "Runs on Atlassian" compliance)

### Error Handling Patterns
- **Custom Error Classes**: Domain-specific error hierarchy extending base Error class
- **Error Codes**: Structured error codes with consistent naming (MCP_400, VALIDATION_ERROR)
- **Error Context**: Rich error objects with additional metadata and details
- **Validation Errors**: Zod schema validation with detailed error messages

## Structural Conventions

### File Organization
- **Co-located Tests**: Test files in `__tests__/` directories alongside source code
- **Index Exports**: Barrel exports in index.ts files for clean imports
- **Type Definitions**: Separate types/ directory with comprehensive type definitions
- **Infrastructure Layer**: Clear separation between infrastructure, shared, and domain code

### Import/Export Patterns
- **Named Exports**: Prefer named exports over default exports for better tree-shaking
- **Barrel Imports**: Use index.ts files to create clean import paths
- **External Dependencies**: Clear separation of external vs internal imports
- **Type-only Imports**: Use `import type` for type-only imports when applicable

### Class Design
- **Single Responsibility**: Classes focused on single concerns (MCPClient, AuthContext)
- **Private Members**: Extensive use of private methods and properties
- **Constructor Injection**: Dependencies injected through constructors
- **Method Chaining**: Fluent interfaces where appropriate (query builders)

## Semantic Patterns

### Authentication & Security
- **Token Validation**: Comprehensive JWT/FIT token validation with proper error handling
- **Scope Checking**: Granular permission checking with `hasScope()` and `assertScope()` patterns
- **Mock Generation**: Test utilities for generating mock tokens and auth contexts
- **Security Comments**: Clear documentation of security implications and production requirements

### Protocol Implementation
- **Version Handling**: Explicit protocol version management (MCPVersion = '1.0')
- **Request/Response Patterns**: Structured request/response with correlation IDs
- **Context Propagation**: Rich context objects with metadata and timestamps
- **Error Propagation**: Consistent error handling across protocol boundaries

### Validation Patterns
- **Zod Schemas**: Runtime validation using Zod with comprehensive schemas
- **Type Guards**: Runtime type checking with `is` type predicates
- **Schema Inference**: TypeScript types inferred from Zod schemas
- **Validation Helpers**: Utility functions for common validation patterns

## Internal API Usage

### MCP SDK Integration
```typescript
// Standard MCP client initialization
const client = new Client({
  name: 'atlantis-mcp-client',
  version: '1.0.0'
}, {
  capabilities: {}
});

// Transport connection pattern
const transport = new StdioClientTransport({
  command: serverCommand,
  args: serverArgs
});
await client.connect(transport);
```

### Error Handling Pattern
```typescript
// Custom error with context
throw new MCPError(
  'Token validation failed',
  MCPErrorCode.UNAUTHORIZED,
  { reason: error.message }
);

// Domain error hierarchy
export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}
```

### Zod Validation Pattern
```typescript
// Schema definition with validation
export const MCPRequestSchema = z.object({
  mcpVersion: z.literal('1.0'),
  requestId: z.string().uuid(),
  contextId: z.string(),
  context: MCPContextSchema,
});

// Type guard implementation
export function isMCPRequest(obj: unknown): obj is MCPRequest {
  const result = MCPRequestSchema.safeParse(obj);
  return result.success;
}
```

## Code Idioms

### Async/Await Patterns
- **Promise Handling**: Consistent use of async/await over Promise chains
- **Error Propagation**: Proper error handling in async functions with try/catch
- **Resource Cleanup**: Proper cleanup in finally blocks (transport.close())
- **Timeout Handling**: Explicit timeout handling for external operations

### Utility Functions
- **Base64 Encoding**: URL-safe base64 encoding/decoding utilities
- **Token Parsing**: JWT token parsing with proper error handling
- **Command Parsing**: CLI command parsing with argument handling
- **JSON Handling**: Safe JSON parsing with fallback error handling

### Testing Patterns
- **Mock Setup**: Comprehensive mocking of Forge APIs in setupTests.ts
- **Jest Configuration**: Global test setup with proper module mocking
- **Test Utilities**: Helper functions for generating test data and mocks
- **Coverage Requirements**: Full test coverage for critical paths

## Annotations & Metadata

### JSDoc Annotations
- **@param**: Detailed parameter descriptions with types
- **@returns**: Return value descriptions with type information
- **@throws**: Exception documentation for error conditions
- **@example**: Code examples for complex functions

### TypeScript Annotations
- **Readonly Properties**: Immutable properties marked as readonly
- **Optional Properties**: Clear distinction between required and optional fields
- **Union Types**: Discriminated unions for type safety
- **Generic Constraints**: Proper generic type constraints

### Configuration Annotations
- **Environment Variables**: Clear documentation of required environment variables
- **Feature Flags**: Configuration options documented with defaults
- **Compliance Notes**: Security and compliance requirements in comments
- **TODO/FIXME**: Clear action items with context and priority