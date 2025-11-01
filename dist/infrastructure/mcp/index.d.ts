/**
 * MCP Infrastructure Module
 * Exports all MCP communication components
 */
export { McpForgeServer, createMcpServer, type MCPRequestHandler, } from './server';
export { McpForgeClient, createMcpClient, type MCPClientConfig, } from './client';
export { validateMCPRequest, validateMCPResponse, validateModuleRegistration, validateWithSchema, assertValidMCPRequest, assertValidMCPResponse, type ValidationResult, } from './validation';
//# sourceMappingURL=index.d.ts.map