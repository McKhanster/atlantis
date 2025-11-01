/**
 * MCP Authentication Layer
 * Handles Forge Invocation Token (FIT) validation
 *
 * For "Runs on Atlassian" compliance, all inter-app communication
 * must use Forge Invocation Tokens (FIT) with JWT validation
 */

import { MCPErrorCode } from '../../types/mcp.js';
import { MCPError } from '../../shared/errors/mcp-error.js';

/**
 * Forge Invocation Token (FIT) structure
 * Note: In production, use @forge/api for token generation/validation
 */
export interface ForgeInvocationToken {
  iss: string; // Issuer (app ID)
  sub: string; // Subject (user account ID)
  aud: string; // Audience (target app/service)
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
  context: {
    cloudId?: string;
    siteUrl?: string;
    environmentId?: string;
    environmentType?: string;
  };
  scopes?: string[];
}

/**
 * Authentication context extracted from validated token
 */
export interface AuthContext {
  appId: string;
  userId: string;
  cloudId?: string;
  scopes: string[];
  validUntil: Date;
}

/**
 * Validate Forge Invocation Token
 *
 * In production, this would use @forge/api's built-in validation.
 * For now, we implement basic JWT structure validation.
 *
 * @param token - The FIT token string (JWT format)
 * @returns AuthContext if valid
 * @throws MCPError if invalid
 */
export function validateForgeInvocationToken(token: string): AuthContext {
  if (!token) {
    throw new MCPError(
      'Missing authentication token',
      MCPErrorCode.UNAUTHORIZED,
      { required: 'Forge Invocation Token (FIT)' }
    );
  }

  try {
    // In production: use @forge/api for proper JWT validation
    // For now, we do basic format validation
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new MCPError(
        'Invalid token format',
        MCPErrorCode.UNAUTHORIZED,
        { expected: 'JWT format (header.payload.signature)' }
      );
    }

    // Decode payload (for demonstration - in production use proper JWT library)
    const payload = decodeBase64Url(parts[1]);
    const claims = JSON.parse(payload) as ForgeInvocationToken;

    // Validate required claims
    if (!claims.iss || !claims.sub || !claims.exp) {
      throw new MCPError(
        'Invalid token claims',
        MCPErrorCode.UNAUTHORIZED,
        { missing: 'Required claims: iss, sub, exp' }
      );
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (claims.exp < now) {
      throw new MCPError(
        'Token expired',
        MCPErrorCode.UNAUTHORIZED,
        { expiredAt: new Date(claims.exp * 1000).toISOString() }
      );
    }

    // Return auth context
    return {
      appId: claims.iss,
      userId: claims.sub,
      cloudId: claims.context?.cloudId,
      scopes: claims.scopes || [],
      validUntil: new Date(claims.exp * 1000),
    };
  } catch (error) {
    if (error instanceof MCPError) {
      throw error;
    }

    throw new MCPError(
      'Token validation failed',
      MCPErrorCode.UNAUTHORIZED,
      {
        reason: error instanceof Error ? error.message : 'Unknown error',
      }
    );
  }
}

/**
 * Check if auth context has required scope
 */
export function hasScope(context: AuthContext, requiredScope: string): boolean {
  return context.scopes.includes(requiredScope);
}

/**
 * Assert that auth context has required scope
 * Throws MCPError if scope is missing
 */
export function assertScope(context: AuthContext, requiredScope: string): void {
  if (!hasScope(context, requiredScope)) {
    throw new MCPError(
      `Missing required scope: ${requiredScope}`,
      MCPErrorCode.FORBIDDEN,
      {
        required: requiredScope,
        available: context.scopes,
      }
    );
  }
}

/**
 * Generate a mock FIT token for testing
 * DO NOT use in production - use @forge/api token generation
 */
export function generateMockFIT(config: {
  appId: string;
  userId: string;
  cloudId?: string;
  scopes?: string[];
  expiresIn?: number; // seconds
}): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload: ForgeInvocationToken = {
    iss: config.appId,
    sub: config.userId,
    aud: 'mcp-server',
    exp: now + (config.expiresIn || 3600),
    iat: now,
    context: {
      cloudId: config.cloudId,
    },
    scopes: config.scopes || ['storage:app'],
  };

  const headerEncoded = encodeBase64Url(JSON.stringify(header));
  const payloadEncoded = encodeBase64Url(JSON.stringify(payload));
  const signature = 'mock-signature'; // In production: proper HMAC signature

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

/**
 * Base64 URL-safe encoding helper
 */
function encodeBase64Url(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64 URL-safe decoding helper
 */
function decodeBase64Url(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}
