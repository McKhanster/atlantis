/**
 * Tests for MCP Authentication
 */

import {
  validateForgeInvocationToken,
  hasScope,
  assertScope,
  generateMockFIT,
  type AuthContext,
} from '../auth';
import { MCPErrorCode } from '../../../types/mcp';
import { MCPError } from '../../../shared/errors/mcp-error';

describe('MCP Authentication', () => {
  describe('generateMockFIT', () => {
    it('should generate a valid mock FIT token', () => {
      const token = generateMockFIT({
        appId: 'ari:cloud:ecosystem::app/test-app',
        userId: 'user-123',
        cloudId: 'cloud-123',
        scopes: ['storage:app', 'read:jira-work'],
        expiresIn: 3600,
      });

      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3);
    });

    it('should use default values when optional params not provided', () => {
      const token = generateMockFIT({
        appId: 'ari:cloud:ecosystem::app/test-app',
        userId: 'user-123',
      });

      expect(token).toBeDefined();
      // Validate the token we just generated
      const context = validateForgeInvocationToken(token);
      expect(context.scopes).toContain('storage:app');
    });
  });

  describe('validateForgeInvocationToken', () => {
    it('should validate a correct mock FIT token', () => {
      const token = generateMockFIT({
        appId: 'ari:cloud:ecosystem::app/test-app',
        userId: 'user-123',
        cloudId: 'cloud-123',
        scopes: ['storage:app', 'read:jira-work'],
        expiresIn: 3600,
      });

      const context = validateForgeInvocationToken(token);

      expect(context.appId).toBe('ari:cloud:ecosystem::app/test-app');
      expect(context.userId).toBe('user-123');
      expect(context.cloudId).toBe('cloud-123');
      expect(context.scopes).toContain('storage:app');
      expect(context.scopes).toContain('read:jira-work');
      expect(context.validUntil).toBeInstanceOf(Date);
    });

    it('should reject missing token', () => {
      expect(() => validateForgeInvocationToken('')).toThrow(MCPError);

      try {
        validateForgeInvocationToken('');
      } catch (error) {
        expect(error).toBeInstanceOf(MCPError);
        expect((error as MCPError).code).toBe(MCPErrorCode.UNAUTHORIZED);
        expect((error as MCPError).message).toBe('Missing authentication token');
      }
    });

    it('should reject invalid token format', () => {
      const invalidToken = 'not.a.valid.jwt.format';

      expect(() => validateForgeInvocationToken(invalidToken)).toThrow(MCPError);

      try {
        validateForgeInvocationToken(invalidToken);
      } catch (error) {
        expect(error).toBeInstanceOf(MCPError);
        expect((error as MCPError).code).toBe(MCPErrorCode.UNAUTHORIZED);
      }
    });

    it('should reject expired token', () => {
      const expiredToken = generateMockFIT({
        appId: 'ari:cloud:ecosystem::app/test-app',
        userId: 'user-123',
        expiresIn: -3600, // Expired 1 hour ago
      });

      expect(() => validateForgeInvocationToken(expiredToken)).toThrow(MCPError);

      try {
        validateForgeInvocationToken(expiredToken);
      } catch (error) {
        expect(error).toBeInstanceOf(MCPError);
        expect((error as MCPError).code).toBe(MCPErrorCode.UNAUTHORIZED);
        expect((error as MCPError).message).toBe('Token expired');
      }
    });

    it('should reject token with missing required claims', () => {
      // Manually create a token with missing claims
      const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64');
      const payload = Buffer.from(
        JSON.stringify({
          // Missing iss, sub, exp
          iat: Math.floor(Date.now() / 1000),
        })
      ).toString('base64');
      const invalidToken = `${header}.${payload}.signature`;

      expect(() => validateForgeInvocationToken(invalidToken)).toThrow(MCPError);
    });
  });

  describe('hasScope', () => {
    const mockContext: AuthContext = {
      appId: 'ari:cloud:ecosystem::app/test-app',
      userId: 'user-123',
      scopes: ['storage:app', 'read:jira-work', 'write:confluence-content'],
      validUntil: new Date(Date.now() + 3600000),
    };

    it('should return true when scope exists', () => {
      expect(hasScope(mockContext, 'storage:app')).toBe(true);
      expect(hasScope(mockContext, 'read:jira-work')).toBe(true);
      expect(hasScope(mockContext, 'write:confluence-content')).toBe(true);
    });

    it('should return false when scope does not exist', () => {
      expect(hasScope(mockContext, 'delete:all')).toBe(false);
      expect(hasScope(mockContext, 'admin:everything')).toBe(false);
    });

    it('should handle empty scopes array', () => {
      const emptyContext: AuthContext = {
        ...mockContext,
        scopes: [],
      };

      expect(hasScope(emptyContext, 'storage:app')).toBe(false);
    });
  });

  describe('assertScope', () => {
    const mockContext: AuthContext = {
      appId: 'ari:cloud:ecosystem::app/test-app',
      userId: 'user-123',
      scopes: ['storage:app', 'read:jira-work'],
      validUntil: new Date(Date.now() + 3600000),
    };

    it('should not throw when scope exists', () => {
      expect(() => assertScope(mockContext, 'storage:app')).not.toThrow();
      expect(() => assertScope(mockContext, 'read:jira-work')).not.toThrow();
    });

    it('should throw MCPError when scope is missing', () => {
      expect(() => assertScope(mockContext, 'write:confluence-content')).toThrow(
        MCPError
      );

      try {
        assertScope(mockContext, 'delete:all');
      } catch (error) {
        expect(error).toBeInstanceOf(MCPError);
        expect((error as MCPError).code).toBe(MCPErrorCode.FORBIDDEN);
        expect((error as MCPError).message).toContain('Missing required scope');
        expect((error as MCPError).details?.required).toBe('delete:all');
        expect((error as MCPError).details?.available).toEqual([
          'storage:app',
          'read:jira-work',
        ]);
      }
    });
  });
});
