# Development Guidelines and Standards

## Code Quality Standards

### TypeScript Standards
- **Strict Mode**: Always use TypeScript strict mode with zero `any` types
- **Explicit Types**: Define explicit interfaces for all function parameters and return values
- **Type Guards**: Use Zod schemas for runtime validation with TypeScript type inference
- **UUID Validation**: Use proper UUID format validation for all identifiers
- **Enum Usage**: Prefer string enums over union types for error codes and constants

### Documentation Standards
- **JSDoc Headers**: Every file starts with `/**` block describing purpose and context
- **Function Documentation**: Document complex functions with parameter and return descriptions
- **Inline Comments**: Use `//` for implementation details and business logic explanations
- **TODO Comments**: Include TODO comments for production improvements (e.g., "TODO: Use @forge/api for proper JWT validation")

### Naming Conventions
- **Classes**: PascalCase with descriptive names (e.g., `McpForgeServer`, `ValidationError`)
- **Interfaces**: PascalCase with descriptive names, avoid "I" prefix
- **Functions**: camelCase with verb-noun pattern (e.g., `validateMCPRequest`, `createSuccessResponse`)
- **Constants**: UPPER_SNAKE_CASE for enums and error codes
- **Files**: kebab-case for file names, match primary export name

## Architectural Patterns

### Error Handling Strategy
- **Custom Error Classes**: Extend base `Error` class with domain-specific errors
- **Error Hierarchies**: Use inheritance (DomainError → ValidationError, NotFoundError, etc.)
- **Error Codes**: Include machine-readable error codes alongside human messages
- **Error Details**: Provide structured details object for debugging context
- **Consistent Throwing**: Always throw custom error types, never generic Error

### Validation Patterns
- **Zod Integration**: Use Zod schemas for both validation and TypeScript type generation
- **Validation Results**: Return `{ success: boolean, data?: T, error?: ErrorType }` objects
- **Assert Functions**: Provide both validation functions and assertion functions that throw
- **Schema Co-location**: Define Zod schemas alongside TypeScript types in same file
- **Runtime Safety**: Validate all external inputs (API requests, user data, etc.)

### Class Design Patterns
- **Constructor Injection**: Pass configuration objects to constructors
- **Private Methods**: Use private methods for internal implementation details
- **Method Chaining**: Support fluent interfaces where appropriate
- **State Management**: Use Maps for dynamic collections, private fields for internal state
- **Logging Integration**: Include structured logging with context information

## MCP Protocol Implementation

### Request/Response Handling
- **UUID Generation**: Use `randomUUID()` from crypto module for all identifiers
- **Timestamp Handling**: Use ISO 8601 format for all timestamps
- **Processing Time**: Track and include processing time in response metadata
- **Error Responses**: Always include error code, message, and optional details
- **Version Consistency**: Maintain MCP version '1.0' across all communications

### Authentication Patterns
- **FIT Token Structure**: Define complete Forge Invocation Token interface
- **JWT Validation**: Implement proper JWT structure validation (header.payload.signature)
- **Claims Validation**: Validate required claims (iss, sub, exp) and check expiration
- **Scope Checking**: Provide both hasScope() and assertScope() functions
- **Mock Generation**: Include mock token generation for testing purposes

### Server Architecture
- **Handler Registration**: Use Map-based handler registration for request types
- **Module Registry**: Maintain separate registry for registered modules
- **Request Routing**: Route requests based on type to appropriate handlers
- **Response Creation**: Use factory methods for consistent response structure
- **Error Propagation**: Catch and convert all errors to MCP error format

## Testing Standards

### Test Organization
- **Co-located Tests**: Place tests in `__tests__/` directories alongside source code
- **Descriptive Names**: Use descriptive test names that explain the scenario
- **Nested Describes**: Group related tests using nested describe blocks
- **Test Data**: Create realistic test data that matches production scenarios
- **Edge Cases**: Test both happy path and error conditions

### Test Patterns
- **Validation Testing**: Test both valid and invalid inputs for all validation functions
- **Error Testing**: Verify correct error types and codes are thrown
- **Mock Usage**: Use mocks sparingly, prefer real implementations where possible
- **Assertion Clarity**: Use specific assertions (toBe, toEqual, toThrow) over generic ones
- **Test Coverage**: Maintain high test coverage with meaningful tests

### Test Data Standards
- **Realistic UUIDs**: Use proper UUID format in test data
- **Valid Timestamps**: Use ISO 8601 format for all timestamp test data
- **Complete Objects**: Provide complete test objects that match real-world usage
- **Error Scenarios**: Include comprehensive error scenario testing
- **Boundary Testing**: Test edge cases and boundary conditions

## Infrastructure Patterns

### Storage Compliance
- **Forge-Only Storage**: Use only Forge Custom Entities and KVS for data persistence
- **Entity Design**: Define entities with proper attributes and indexes
- **Query Optimization**: Use appropriate indexes for common query patterns
- **Data Modeling**: Structure entities to support business requirements efficiently

### Configuration Management
- **Environment Awareness**: Support different configurations for development/production
- **Dependency Injection**: Use constructor injection for dependencies
- **Configuration Objects**: Pass configuration as structured objects
- **Default Values**: Provide sensible defaults for optional configuration

### Logging Standards
- **Structured Logging**: Use consistent log message format with context
- **Log Levels**: Use appropriate log levels (console.log, console.error)
- **Request Tracking**: Include request IDs in all related log messages
- **Performance Logging**: Log processing times for performance monitoring
- **Error Context**: Include full error context in error logs

## Code Organization

### File Structure
- **Single Responsibility**: Each file should have a single primary responsibility
- **Export Patterns**: Use named exports for utilities, default exports for main classes
- **Index Files**: Use index.ts files to create clean public APIs
- **Type Definitions**: Co-locate type definitions with implementation
- **Test Co-location**: Keep tests close to implementation code

### Import/Export Standards
- **Explicit Imports**: Use explicit named imports rather than wildcard imports
- **Relative Imports**: Use relative imports for local modules, absolute for external
- **Type-Only Imports**: Use `import type` for type-only imports
- **Export Organization**: Group and organize exports logically
- **Circular Dependencies**: Avoid circular dependencies through proper layering

### Performance Considerations
- **Lazy Loading**: Load modules only when needed
- **Caching Strategy**: Implement appropriate caching for expensive operations
- **Memory Management**: Clean up resources and avoid memory leaks
- **Async Patterns**: Use proper async/await patterns for all asynchronous operations
- **Error Recovery**: Implement graceful error recovery and fallback mechanisms