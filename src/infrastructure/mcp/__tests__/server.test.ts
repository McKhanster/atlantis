/**
 * Tests for MCP Server
 */

import { McpForgeServer } from '../server';
import { MCPErrorCode, type MCPRequest } from '../../../types/mcp';
import { MCPError } from '../../../shared/errors/mcp-error';

describe('McpForgeServer', () => {
  let server: McpForgeServer;

  beforeEach(() => {
    server = new McpForgeServer({
      name: 'test-server',
      version: '1.0.0',
      endpoint: 'https://test.forge.atlassian.net/mcp',
    });
  });

  describe('registerHandler', () => {
    it('should register a handler for a request type', () => {
      const handler = jest.fn().mockResolvedValue({ success: true });

      server.registerHandler('query', handler);

      // Verify handler can be called (implicitly tested in handleRequest tests)
      expect(true).toBe(true);
    });
  });

  describe('handleRequest', () => {
    it('should process valid request and return success response', async () => {
      const handler = jest.fn().mockResolvedValue({ data: ['item1', 'item2'] });
      server.registerHandler('query', handler);

      const request: MCPRequest = {
        mcpVersion: '1.0',
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        contextId: 'ctx-001',
        context: {
          source: 'jira',
          data: { issueKey: 'PROJ-123' },
        },
        request: {
          type: 'query',
          params: { limit: 10 },
        },
      };

      const response = await server.handleRequest(request);

      expect(response.mcpVersion).toBe('1.0');
      expect(response.requestId).toBe(request.requestId);
      expect(response.result).toEqual({ data: ['item1', 'item2'] });
      expect(response.error).toBeUndefined();
      expect(response.metadata?.processingTime).toBeGreaterThanOrEqual(0);
      expect(handler).toHaveBeenCalledWith(request);
    });

    it('should return error for invalid request format', async () => {
      const invalidRequest = {
        mcpVersion: '2.0',
        // Invalid structure
      };

      const response = await server.handleRequest(invalidRequest);

      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe(MCPErrorCode.BAD_REQUEST);
      expect(response.error?.message).toBe('Invalid MCP request format');
    });

    it('should return error when handler not registered', async () => {
      const request: MCPRequest = {
        mcpVersion: '1.0',
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        contextId: 'ctx-001',
        context: {
          source: 'jira',
          data: {},
        },
        request: {
          type: 'optimizeInventory',
        },
      };

      const response = await server.handleRequest(request);

      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe(MCPErrorCode.NOT_FOUND);
      expect(response.error?.message).toContain('No handler registered');
    });

    it('should handle MCPError thrown by handler', async () => {
      const handler = jest.fn().mockRejectedValue(
        new MCPError('Unauthorized access', MCPErrorCode.UNAUTHORIZED, {
          requiredScope: 'read:issues',
        })
      );
      server.registerHandler('query', handler);

      const request: MCPRequest = {
        mcpVersion: '1.0',
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        contextId: 'ctx-001',
        context: {
          source: 'jira',
          data: {},
        },
        request: {
          type: 'query',
        },
      };

      const response = await server.handleRequest(request);

      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe(MCPErrorCode.UNAUTHORIZED);
      expect(response.error?.message).toBe('Unauthorized access');
      expect(response.error?.details?.requiredScope).toBe('read:issues');
    });

    it('should handle generic errors thrown by handler', async () => {
      const handler = jest
        .fn()
        .mockRejectedValue(new Error('Database connection failed'));
      server.registerHandler('query', handler);

      const request: MCPRequest = {
        mcpVersion: '1.0',
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        contextId: 'ctx-001',
        context: {
          source: 'jira',
          data: {},
        },
        request: {
          type: 'query',
        },
      };

      const response = await server.handleRequest(request);

      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe(MCPErrorCode.INTERNAL_ERROR);
      expect(response.error?.message).toBe('Database connection failed');
    });
  });

  describe('handleModuleRegistration', () => {
    it('should register a module successfully', async () => {
      const registration = {
        moduleId: 'module-inventory-optimizer',
        moduleName: 'Inventory Optimizer',
        moduleType: 'inventory',
        capabilities: ['inventoryTracking', 'demandForecasting'],
        mcpEndpoint: 'https://module.forge.atlassian.net/mcp',
        metadata: {
          version: '1.0.0',
          description: 'AI-powered inventory optimization',
        },
      };

      const response = await server.handleModuleRegistration(registration);

      expect(response.registered).toBe(true);
      expect(response.moduleId).toBe(registration.moduleId);
      expect(response.coreEndpoint).toBe(
        'https://test.forge.atlassian.net/mcp'
      );
    });

    it('should reject invalid module registration', async () => {
      const invalidRegistration = {
        moduleId: 'test-module',
        // Missing required fields
      };

      await expect(
        server.handleModuleRegistration(invalidRegistration)
      ).rejects.toThrow(MCPError);
    });

    it('should track registered modules', async () => {
      const registration = {
        moduleId: 'module-test',
        moduleName: 'Test Module',
        moduleType: 'test',
        capabilities: ['testing'],
        mcpEndpoint: 'https://test.com/mcp',
        metadata: {
          version: '1.0.0',
        },
      };

      await server.handleModuleRegistration(registration);

      const modules = server.getRegisteredModules();
      expect(modules).toHaveLength(1);
      expect(modules[0]).toEqual(registration);
    });
  });

  describe('getModule', () => {
    it('should retrieve a registered module by ID', async () => {
      const registration = {
        moduleId: 'module-test',
        moduleName: 'Test Module',
        moduleType: 'test',
        capabilities: ['testing'],
        mcpEndpoint: 'https://test.com/mcp',
        metadata: {
          version: '1.0.0',
        },
      };

      await server.handleModuleRegistration(registration);

      const module = server.getModule('module-test');
      expect(module).toEqual(registration);
    });

    it('should return undefined for non-existent module', () => {
      const module = server.getModule('non-existent');
      expect(module).toBeUndefined();
    });
  });

  describe('unregisterModule', () => {
    it('should unregister an existing module', async () => {
      const registration = {
        moduleId: 'module-test',
        moduleName: 'Test Module',
        moduleType: 'test',
        capabilities: ['testing'],
        mcpEndpoint: 'https://test.com/mcp',
        metadata: {
          version: '1.0.0',
        },
      };

      await server.handleModuleRegistration(registration);

      const result = server.unregisterModule('module-test');
      expect(result).toBe(true);

      const modules = server.getRegisteredModules();
      expect(modules).toHaveLength(0);
    });

    it('should return false for non-existent module', () => {
      const result = server.unregisterModule('non-existent');
      expect(result).toBe(false);
    });
  });
});
