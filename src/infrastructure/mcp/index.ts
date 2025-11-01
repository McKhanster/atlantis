/**
 * MCP Infrastructure Module
 * Exports all MCP communication components
 */



export {
  McpForgeClient,
  createMcpClient,
  type MCPClientConfig,
} from './client.js';

export {
  validateMCPRequest,
  validateMCPResponse,
  validateModuleRegistration,
  validateWithSchema,
  assertValidMCPRequest,
  assertValidMCPResponse,
  type ValidationResult,
} from './validation.js';
