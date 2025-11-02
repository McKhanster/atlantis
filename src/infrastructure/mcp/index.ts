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
  validateModuleRegistration,
  validateWithSchema,
  type ValidationResult,
} from './validation.js';
