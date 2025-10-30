/**
 * Tests for MCP Validation Layer
 */

import {
  validateMCPRequest,
  validateMCPResponse,
  validateModuleRegistration,
  assertValidMCPRequest,
  assertValidMCPResponse,
} from '../validation';
import { MCPErrorCode } from '../../../types/mcp';
import { MCPError } from '../../../shared/errors/mcp-error';

describe('MCP Validation', () => {
  describe('validateMCPRequest', () => {
    it('should validate a correct MCP request', () => {
      const validRequest = {
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

      const result = validateMCPRequest(validRequest);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validRequest);
      expect(result.error).toBeUndefined();
    });

    it('should reject request with invalid version', () => {
      const invalidRequest = {
        mcpVersion: '2.0',
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

      const result = validateMCPRequest(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(MCPErrorCode.BAD_REQUEST);
      expect(result.error?.message).toBe('Invalid MCP request format');
    });

    it('should reject request with invalid UUID', () => {
      const invalidRequest = {
        mcpVersion: '1.0',
        requestId: 'not-a-uuid',
        contextId: 'ctx-001',
        context: {
          source: 'jira',
          data: {},
        },
        request: {
          type: 'query',
        },
      };

      const result = validateMCPRequest(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(MCPErrorCode.BAD_REQUEST);
    });

    it('should reject request with invalid source', () => {
      const invalidRequest = {
        mcpVersion: '1.0',
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        contextId: 'ctx-001',
        context: {
          source: 'invalid-source',
          data: {},
        },
        request: {
          type: 'query',
        },
      };

      const result = validateMCPRequest(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(MCPErrorCode.BAD_REQUEST);
    });

    it('should reject request with missing required fields', () => {
      const invalidRequest = {
        mcpVersion: '1.0',
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        // Missing contextId, context, request
      };

      const result = validateMCPRequest(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error?.details?.issues).toBeDefined();
    });

    it('should accept request with optional metadata', () => {
      const validRequest = {
        mcpVersion: '1.0',
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        contextId: 'ctx-001',
        context: {
          source: 'confluence',
          data: { pageId: '12345' },
          metadata: {
            timestamp: '2025-10-30T12:00:00Z',
            userId: 'user-123',
            tenantId: 'tenant-001',
          },
        },
        request: {
          type: 'update',
        },
      };

      const result = validateMCPRequest(validRequest);

      expect(result.success).toBe(true);
      expect(result.data?.context.metadata).toBeDefined();
    });
  });

  describe('validateMCPResponse', () => {
    it('should validate a correct MCP response', () => {
      const validResponse = {
        responseId: '123e4567-e89b-12d3-a456-426614174001',
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        mcpVersion: '1.0',
        result: { success: true, data: [] },
        metadata: {
          timestamp: '2025-10-30T12:00:01Z',
          processingTime: 150,
        },
      };

      const result = validateMCPResponse(validResponse);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validResponse);
    });

    it('should validate a response with error', () => {
      const errorResponse = {
        responseId: '123e4567-e89b-12d3-a456-426614174001',
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        mcpVersion: '1.0',
        error: {
          code: 'MCP_500',
          message: 'Internal server error',
          details: { stack: 'Error stack trace' },
        },
      };

      const result = validateMCPResponse(errorResponse);

      expect(result.success).toBe(true);
      expect(result.data?.error).toBeDefined();
    });

    it('should reject response with invalid UUIDs', () => {
      const invalidResponse = {
        responseId: 'not-a-uuid',
        requestId: 'also-not-a-uuid',
        mcpVersion: '1.0',
      };

      const result = validateMCPResponse(invalidResponse);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(MCPErrorCode.INTERNAL_ERROR);
    });
  });

  describe('validateModuleRegistration', () => {
    it('should validate a correct registration request', () => {
      const validRegistration = {
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

      const result = validateModuleRegistration(validRegistration);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validRegistration);
    });

    it('should reject registration with invalid URL', () => {
      const invalidRegistration = {
        moduleId: 'module-test',
        moduleName: 'Test Module',
        moduleType: 'test',
        capabilities: [],
        mcpEndpoint: 'not-a-valid-url',
        metadata: {
          version: '1.0.0',
        },
      };

      const result = validateModuleRegistration(invalidRegistration);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(MCPErrorCode.BAD_REQUEST);
    });
  });

  describe('assertValidMCPRequest', () => {
    it('should not throw for valid request', () => {
      const validRequest = {
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

      expect(() => assertValidMCPRequest(validRequest)).not.toThrow();
    });

    it('should throw MCPError for invalid request', () => {
      const invalidRequest = {
        mcpVersion: '1.0',
        // Missing required fields
      };

      expect(() => assertValidMCPRequest(invalidRequest)).toThrow(MCPError);

      try {
        assertValidMCPRequest(invalidRequest);
      } catch (error) {
        expect(error).toBeInstanceOf(MCPError);
        expect((error as MCPError).code).toBe(MCPErrorCode.BAD_REQUEST);
      }
    });
  });

  describe('assertValidMCPResponse', () => {
    it('should not throw for valid response', () => {
      const validResponse = {
        responseId: '123e4567-e89b-12d3-a456-426614174001',
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        mcpVersion: '1.0',
      };

      expect(() => assertValidMCPResponse(validResponse)).not.toThrow();
    });

    it('should throw MCPError for invalid response', () => {
      const invalidResponse = {
        responseId: 'invalid',
        requestId: 'invalid',
      };

      expect(() => assertValidMCPResponse(invalidResponse)).toThrow(MCPError);
    });
  });
});
