"use strict";
/**
 * MCP Validation Layer
 * Validates MCP requests/responses and provides detailed error information
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMCPRequest = validateMCPRequest;
exports.validateMCPResponse = validateMCPResponse;
exports.validateModuleRegistration = validateModuleRegistration;
exports.validateWithSchema = validateWithSchema;
exports.assertValidMCPRequest = assertValidMCPRequest;
exports.assertValidMCPResponse = assertValidMCPResponse;
const mcp_1 = require("../../types/mcp");
const mcp_error_1 = require("../../shared/errors/mcp-error");
/**
 * Validates an MCP request
 */
function validateMCPRequest(obj) {
    const result = mcp_1.MCPRequestSchema.safeParse(obj);
    if (result.success) {
        return {
            success: true,
            data: result.data,
        };
    }
    return {
        success: false,
        error: {
            code: mcp_1.MCPErrorCode.BAD_REQUEST,
            message: 'Invalid MCP request format',
            details: {
                issues: result.error.issues.map((issue) => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                })),
            },
        },
    };
}
/**
 * Validates an MCP response
 */
function validateMCPResponse(obj) {
    const result = mcp_1.MCPResponseSchema.safeParse(obj);
    if (result.success) {
        return {
            success: true,
            data: result.data,
        };
    }
    return {
        success: false,
        error: {
            code: mcp_1.MCPErrorCode.INTERNAL_ERROR,
            message: 'Invalid MCP response format',
            details: {
                issues: result.error.issues.map((issue) => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                })),
            },
        },
    };
}
/**
 * Validates a module registration request
 */
function validateModuleRegistration(obj) {
    const result = mcp_1.ModuleRegistrationRequestSchema.safeParse(obj);
    if (result.success) {
        return {
            success: true,
            data: result.data,
        };
    }
    return {
        success: false,
        error: {
            code: mcp_1.MCPErrorCode.BAD_REQUEST,
            message: 'Invalid module registration request',
            details: {
                issues: result.error.issues.map((issue) => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                })),
            },
        },
    };
}
/**
 * Validates any object against a Zod schema
 * Generic validation helper
 */
function validateWithSchema(schema, obj, errorMessage) {
    const result = schema.safeParse(obj);
    if (result.success) {
        return {
            success: true,
            data: result.data,
        };
    }
    return {
        success: false,
        error: {
            code: mcp_1.MCPErrorCode.BAD_REQUEST,
            message: errorMessage,
            details: {
                issues: result.error.issues.map((issue) => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                })),
            },
        },
    };
}
/**
 * Throws an MCPError if validation fails
 * Useful for validation in request handlers
 */
function assertValidMCPRequest(obj) {
    const validation = validateMCPRequest(obj);
    if (!validation.success) {
        throw new mcp_error_1.MCPError(validation.error.message, validation.error.code, validation.error.details);
    }
}
/**
 * Throws an MCPError if validation fails
 */
function assertValidMCPResponse(obj) {
    const validation = validateMCPResponse(obj);
    if (!validation.success) {
        throw new mcp_error_1.MCPError(validation.error.message, validation.error.code, validation.error.details);
    }
}
//# sourceMappingURL=validation.js.map