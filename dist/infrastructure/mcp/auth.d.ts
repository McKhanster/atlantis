/**
 * MCP Authentication Layer
 * Handles Forge Invocation Token (FIT) validation
 *
 * For "Runs on Atlassian" compliance, all inter-app communication
 * must use Forge Invocation Tokens (FIT) with JWT validation
 */
/**
 * Forge Invocation Token (FIT) structure
 * Note: In production, use @forge/api for token generation/validation
 */
export interface ForgeInvocationToken {
    iss: string;
    sub: string;
    aud: string;
    exp: number;
    iat: number;
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
export declare function validateForgeInvocationToken(token: string): AuthContext;
/**
 * Check if auth context has required scope
 */
export declare function hasScope(context: AuthContext, requiredScope: string): boolean;
/**
 * Assert that auth context has required scope
 * Throws MCPError if scope is missing
 */
export declare function assertScope(context: AuthContext, requiredScope: string): void;
/**
 * Generate a mock FIT token for testing
 * DO NOT use in production - use @forge/api token generation
 */
export declare function generateMockFIT(config: {
    appId: string;
    userId: string;
    cloudId?: string;
    scopes?: string[];
    expiresIn?: number;
}): string;
//# sourceMappingURL=auth.d.ts.map