"use strict";
/**
 * MCP Protocol Type Definitions
 * Model Context Protocol for module-to-core communication
 *
 * This file defines custom MCP types that extend the standard MCP SDK
 * for our -specific use cases while maintaining compatibility with
 * @modelcontextprotocol/sdk v1.20.2
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleRegistrationRequestSchema = exports.MCPErrorCode = exports.MCPResponseSchema = exports.MCPErrorSchema = exports.MCPRequestSchema = exports.MCPContextSchema = exports.MCPRequestTypeSchema = exports.MCPSourceSchema = void 0;
exports.isMCPRequest = isMCPRequest;
exports.isMCPResponse = isMCPResponse;
const zod_1 = require("zod");
// Zod schemas for validation
exports.MCPSourceSchema = zod_1.z.enum(['jira', 'confluence', 'module']);
exports.MCPRequestTypeSchema = zod_1.z.enum([
    'optimizeInventory',
    'scoreVendor',
    'forecastOperation',
    'analyzeBudget',
    'query',
    'update',
    'register',
    'route',
    'broadcast',
    'connect',
]);
// Zod schemas for request/response validation
exports.MCPContextSchema = zod_1.z.object({
    source: exports.MCPSourceSchema,
    data: zod_1.z.record(zod_1.z.unknown()),
    metadata: zod_1.z
        .object({
        timestamp: zod_1.z.string().datetime(),
        userId: zod_1.z.string().optional(),
        tenantId: zod_1.z.string().optional(),
    })
        .optional(),
});
exports.MCPRequestSchema = zod_1.z.object({
    mcpVersion: zod_1.z.literal('1.0'),
    requestId: zod_1.z.string().uuid(),
    contextId: zod_1.z.string(),
    context: exports.MCPContextSchema,
    request: zod_1.z.object({
        type: exports.MCPRequestTypeSchema,
        params: zod_1.z.record(zod_1.z.unknown()).optional(),
    }),
    auth: zod_1.z
        .object({
        token: zod_1.z.string(),
    })
        .optional(),
});
exports.MCPErrorSchema = zod_1.z.object({
    code: zod_1.z.string(),
    message: zod_1.z.string(),
    details: zod_1.z.record(zod_1.z.unknown()).optional(),
});
exports.MCPResponseSchema = zod_1.z.object({
    responseId: zod_1.z.string().uuid(),
    requestId: zod_1.z.string().uuid(),
    mcpVersion: zod_1.z.literal('1.0'),
    result: zod_1.z.record(zod_1.z.unknown()).optional(),
    contextUpdate: zod_1.z.record(zod_1.z.unknown()).optional(),
    error: exports.MCPErrorSchema.optional(),
    metadata: zod_1.z
        .object({
        timestamp: zod_1.z.string().datetime(),
        processingTime: zod_1.z.number(),
    })
        .optional(),
});
var MCPErrorCode;
(function (MCPErrorCode) {
    MCPErrorCode["BAD_REQUEST"] = "MCP_400";
    MCPErrorCode["UNAUTHORIZED"] = "MCP_401";
    MCPErrorCode["FORBIDDEN"] = "MCP_403";
    MCPErrorCode["NOT_FOUND"] = "MCP_404";
    MCPErrorCode["INTERNAL_ERROR"] = "MCP_500";
    MCPErrorCode["SERVICE_UNAVAILABLE"] = "MCP_503";
})(MCPErrorCode || (exports.MCPErrorCode = MCPErrorCode = {}));
// Type guards using Zod validation
function isMCPRequest(obj) {
    const result = exports.MCPRequestSchema.safeParse(obj);
    return result.success;
}
function isMCPResponse(obj) {
    const result = exports.MCPResponseSchema.safeParse(obj);
    return result.success;
}
exports.ModuleRegistrationRequestSchema = zod_1.z.object({
    moduleId: zod_1.z.string(),
    moduleName: zod_1.z.string(),
    moduleType: zod_1.z.string(),
    capabilities: zod_1.z.array(zod_1.z.string()),
    mcpEndpoint: zod_1.z.string().url(),
    metadata: zod_1.z.object({
        version: zod_1.z.string(),
        description: zod_1.z.string().optional(),
    }),
});
//# sourceMappingURL=mcp.js.map