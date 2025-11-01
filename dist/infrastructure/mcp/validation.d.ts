/**
 * MCP Validation Layer
 * Validates MCP requests/responses and provides detailed error information
 */
import { z } from 'zod';
import { type MCPRequest, type MCPResponse, type ModuleRegistrationRequest, MCPErrorCode } from '../../types/mcp';
export interface ValidationResult<T> {
    success: boolean;
    data?: T;
    error?: {
        code: MCPErrorCode;
        message: string;
        details?: Record<string, unknown>;
    };
}
/**
 * Validates an MCP request
 */
export declare function validateMCPRequest(obj: unknown): ValidationResult<MCPRequest>;
/**
 * Validates an MCP response
 */
export declare function validateMCPResponse(obj: unknown): ValidationResult<MCPResponse>;
/**
 * Validates a module registration request
 */
export declare function validateModuleRegistration(obj: unknown): ValidationResult<ModuleRegistrationRequest>;
/**
 * Validates any object against a Zod schema
 * Generic validation helper
 */
export declare function validateWithSchema<T>(schema: z.ZodSchema<T>, obj: unknown, errorMessage: string): ValidationResult<T>;
/**
 * Throws an MCPError if validation fails
 * Useful for validation in request handlers
 */
export declare function assertValidMCPRequest(obj: unknown): asserts obj is MCPRequest;
/**
 * Throws an MCPError if validation fails
 */
export declare function assertValidMCPResponse(obj: unknown): asserts obj is MCPResponse;
//# sourceMappingURL=validation.d.ts.map