"use strict";
/**
 * MCP Authentication Layer
 * Handles Forge Invocation Token (FIT) validation
 *
 * For "Runs on Atlassian" compliance, all inter-app communication
 * must use Forge Invocation Tokens (FIT) with JWT validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateForgeInvocationToken = validateForgeInvocationToken;
exports.hasScope = hasScope;
exports.assertScope = assertScope;
exports.generateMockFIT = generateMockFIT;
const mcp_1 = require("../../types/mcp");
const mcp_error_1 = require("../../shared/errors/mcp-error");
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
function validateForgeInvocationToken(token) {
    if (!token) {
        throw new mcp_error_1.MCPError('Missing authentication token', mcp_1.MCPErrorCode.UNAUTHORIZED, { required: 'Forge Invocation Token (FIT)' });
    }
    try {
        // In production: use @forge/api for proper JWT validation
        // For now, we do basic format validation
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new mcp_error_1.MCPError('Invalid token format', mcp_1.MCPErrorCode.UNAUTHORIZED, { expected: 'JWT format (header.payload.signature)' });
        }
        // Decode payload (for demonstration - in production use proper JWT library)
        const payload = decodeBase64Url(parts[1]);
        const claims = JSON.parse(payload);
        // Validate required claims
        if (!claims.iss || !claims.sub || !claims.exp) {
            throw new mcp_error_1.MCPError('Invalid token claims', mcp_1.MCPErrorCode.UNAUTHORIZED, { missing: 'Required claims: iss, sub, exp' });
        }
        // Check expiration
        const now = Math.floor(Date.now() / 1000);
        if (claims.exp < now) {
            throw new mcp_error_1.MCPError('Token expired', mcp_1.MCPErrorCode.UNAUTHORIZED, { expiredAt: new Date(claims.exp * 1000).toISOString() });
        }
        // Return auth context
        return {
            appId: claims.iss,
            userId: claims.sub,
            cloudId: claims.context?.cloudId,
            scopes: claims.scopes || [],
            validUntil: new Date(claims.exp * 1000),
        };
    }
    catch (error) {
        if (error instanceof mcp_error_1.MCPError) {
            throw error;
        }
        throw new mcp_error_1.MCPError('Token validation failed', mcp_1.MCPErrorCode.UNAUTHORIZED, {
            reason: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * Check if auth context has required scope
 */
function hasScope(context, requiredScope) {
    return context.scopes.includes(requiredScope);
}
/**
 * Assert that auth context has required scope
 * Throws MCPError if scope is missing
 */
function assertScope(context, requiredScope) {
    if (!hasScope(context, requiredScope)) {
        throw new mcp_error_1.MCPError(`Missing required scope: ${requiredScope}`, mcp_1.MCPErrorCode.FORBIDDEN, {
            required: requiredScope,
            available: context.scopes,
        });
    }
}
/**
 * Generate a mock FIT token for testing
 * DO NOT use in production - use @forge/api token generation
 */
function generateMockFIT(config) {
    const header = {
        alg: 'HS256',
        typ: 'JWT',
    };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
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
function encodeBase64Url(str) {
    return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}
/**
 * Base64 URL-safe decoding helper
 */
function decodeBase64Url(str) {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (base64.length % 4) {
        base64 += '=';
    }
    return Buffer.from(base64, 'base64').toString('utf8');
}
//# sourceMappingURL=auth.js.map