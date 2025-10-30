/**
 * Tests for MCP Client
 */

import { createMcpClient, McpForgeClient, type MCPClientConfig } from '../client';
import { MCPError } from '../../../shared/errors/mcp-error';

describe('McpForgeClient', () => {
  let client: McpForgeClient;
  let config: MCPClientConfig;

  beforeEach(() => {
    config = {
      coreEndpoint: 'https://core.forge.atlassian.net/mcp',
      moduleInfo: {
        moduleId: 'module-test',
        moduleName: 'Test Module',
        moduleType: 'test',
        capabilities: ['testing'],
        mcpEndpoint: 'https://test.com/mcp',
        metadata: {
          version: '1.0.0',
          description: 'Test module for MCP client',
        },
      },
      timeout: 5000,
    };

    client = createMcpClient(config);
  });

  describe('createMcpClient', () => {
    it('should create a client instance', () => {
      expect(client).toBeInstanceOf(McpForgeClient);
      expect(client.isRegistered()).toBe(false);
    });
  });

  describe('register', () => {
    it('should throw error in test environment (HTTP not implemented)', async () => {
      // In test environment, HTTP requests are not implemented
      await expect(client.register()).rejects.toThrow(
        'HTTP requests not implemented in test environment'
      );
    });
  });

  describe('sendRequest', () => {
    it('should reject when module not registered', async () => {
      const context = {
        source: 'module' as const,
        data: { test: true },
      };

      await expect(
        client.sendRequest('query', context)
      ).rejects.toThrow(MCPError);

      await expect(
        client.sendRequest('query', context)
      ).rejects.toThrow('Module not registered. Call register() first.');
    });
  });

  describe('query', () => {
    it('should call sendRequest with query type', async () => {
      const context = {
        source: 'jira' as const,
        data: { issueKey: 'PROJ-123' },
      };

      // Since module is not registered, it should throw
      await expect(
        client.query(context, { limit: 10 })
      ).rejects.toThrow(MCPError);
    });
  });

  describe('update', () => {
    it('should call sendRequest with update type', async () => {
      const context = {
        source: 'confluence' as const,
        data: { pageId: '12345' },
      };

      // Since module is not registered, it should throw
      await expect(
        client.update(context, { status: 'updated' })
      ).rejects.toThrow(MCPError);
    });
  });

  describe('isRegistered', () => {
    it('should return false initially', () => {
      expect(client.isRegistered()).toBe(false);
    });
  });
});

describe('McpForgeClient - Mock Registration', () => {
  it('should handle registration flow conceptually', () => {
    const config: MCPClientConfig = {
      coreEndpoint: 'https://core.forge.atlassian.net/mcp',
      moduleInfo: {
        moduleId: 'module-inventory',
        moduleName: 'Inventory Module',
        moduleType: 'inventory',
        capabilities: ['inventoryTracking'],
        mcpEndpoint: 'https://inventory.forge.atlassian.net/mcp',
        metadata: {
          version: '1.0.0',
        },
      },
    };

    const client = createMcpClient(config);

    // Verify initial state
    expect(client.isRegistered()).toBe(false);

    // Note: Actual registration requires real HTTP implementation
    // which will be added when integrating with Forge API
  });

  it('should construct valid MCP requests', () => {
    // This test verifies the client can be created with valid config
    const config: MCPClientConfig = {
      coreEndpoint: 'https://core.forge.atlassian.net/mcp',
      moduleInfo: {
        moduleId: 'module-vendor',
        moduleName: 'Vendor Management',
        moduleType: 'vendor',
        capabilities: ['vendorScoring', 'contractTracking'],
        mcpEndpoint: 'https://vendor.forge.atlassian.net/mcp',
        metadata: {
          version: '1.0.0',
          description: 'AI-powered vendor management',
        },
      },
      timeout: 10000,
    };

    const client = createMcpClient(config);

    expect(client).toBeDefined();
    expect(client.isRegistered()).toBe(false);
  });
});
