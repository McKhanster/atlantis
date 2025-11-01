/**
 * MCP Protocol Type Definitions
 * Model Context Protocol for module-to-core communication
 *
 * This file defines custom MCP types that extend the standard MCP SDK
 * for our -specific use cases while maintaining compatibility with
 * @modelcontextprotocol/sdk v1.20.2
 */
import { z } from 'zod';
export type MCPVersion = '1.0';
export type MCPSource = 'jira' | 'confluence' | 'module';
export type MCPRequestType = 'optimizeInventory' | 'scoreVendor' | 'forecastOperation' | 'analyzeBudget' | 'query' | 'update' | 'register' | 'route' | 'broadcast' | 'connect';
export declare const MCPSourceSchema: z.ZodEnum<["jira", "confluence", "module"]>;
export declare const MCPRequestTypeSchema: z.ZodEnum<["optimizeInventory", "scoreVendor", "forecastOperation", "analyzeBudget", "query", "update", "register", "route", "broadcast", "connect"]>;
export declare const MCPContextSchema: z.ZodObject<{
    source: z.ZodEnum<["jira", "confluence", "module"]>;
    data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    metadata: z.ZodOptional<z.ZodObject<{
        timestamp: z.ZodString;
        userId: z.ZodOptional<z.ZodString>;
        tenantId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        userId?: string | undefined;
        tenantId?: string | undefined;
    }, {
        timestamp: string;
        userId?: string | undefined;
        tenantId?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    data: Record<string, unknown>;
    source: "jira" | "confluence" | "module";
    metadata?: {
        timestamp: string;
        userId?: string | undefined;
        tenantId?: string | undefined;
    } | undefined;
}, {
    data: Record<string, unknown>;
    source: "jira" | "confluence" | "module";
    metadata?: {
        timestamp: string;
        userId?: string | undefined;
        tenantId?: string | undefined;
    } | undefined;
}>;
export declare const MCPRequestSchema: z.ZodObject<{
    mcpVersion: z.ZodLiteral<"1.0">;
    requestId: z.ZodString;
    contextId: z.ZodString;
    context: z.ZodObject<{
        source: z.ZodEnum<["jira", "confluence", "module"]>;
        data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        metadata: z.ZodOptional<z.ZodObject<{
            timestamp: z.ZodString;
            userId: z.ZodOptional<z.ZodString>;
            tenantId: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            timestamp: string;
            userId?: string | undefined;
            tenantId?: string | undefined;
        }, {
            timestamp: string;
            userId?: string | undefined;
            tenantId?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        data: Record<string, unknown>;
        source: "jira" | "confluence" | "module";
        metadata?: {
            timestamp: string;
            userId?: string | undefined;
            tenantId?: string | undefined;
        } | undefined;
    }, {
        data: Record<string, unknown>;
        source: "jira" | "confluence" | "module";
        metadata?: {
            timestamp: string;
            userId?: string | undefined;
            tenantId?: string | undefined;
        } | undefined;
    }>;
    request: z.ZodObject<{
        type: z.ZodEnum<["optimizeInventory", "scoreVendor", "forecastOperation", "analyzeBudget", "query", "update", "register", "route", "broadcast", "connect"]>;
        params: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        type: "connect" | "optimizeInventory" | "scoreVendor" | "forecastOperation" | "analyzeBudget" | "query" | "update" | "register" | "route" | "broadcast";
        params?: Record<string, unknown> | undefined;
    }, {
        type: "connect" | "optimizeInventory" | "scoreVendor" | "forecastOperation" | "analyzeBudget" | "query" | "update" | "register" | "route" | "broadcast";
        params?: Record<string, unknown> | undefined;
    }>;
    auth: z.ZodOptional<z.ZodObject<{
        token: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        token: string;
    }, {
        token: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    mcpVersion: "1.0";
    requestId: string;
    contextId: string;
    context: {
        data: Record<string, unknown>;
        source: "jira" | "confluence" | "module";
        metadata?: {
            timestamp: string;
            userId?: string | undefined;
            tenantId?: string | undefined;
        } | undefined;
    };
    request: {
        type: "connect" | "optimizeInventory" | "scoreVendor" | "forecastOperation" | "analyzeBudget" | "query" | "update" | "register" | "route" | "broadcast";
        params?: Record<string, unknown> | undefined;
    };
    auth?: {
        token: string;
    } | undefined;
}, {
    mcpVersion: "1.0";
    requestId: string;
    contextId: string;
    context: {
        data: Record<string, unknown>;
        source: "jira" | "confluence" | "module";
        metadata?: {
            timestamp: string;
            userId?: string | undefined;
            tenantId?: string | undefined;
        } | undefined;
    };
    request: {
        type: "connect" | "optimizeInventory" | "scoreVendor" | "forecastOperation" | "analyzeBudget" | "query" | "update" | "register" | "route" | "broadcast";
        params?: Record<string, unknown> | undefined;
    };
    auth?: {
        token: string;
    } | undefined;
}>;
export declare const MCPErrorSchema: z.ZodObject<{
    code: z.ZodString;
    message: z.ZodString;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    code: string;
    message: string;
    details?: Record<string, unknown> | undefined;
}, {
    code: string;
    message: string;
    details?: Record<string, unknown> | undefined;
}>;
export declare const MCPResponseSchema: z.ZodObject<{
    responseId: z.ZodString;
    requestId: z.ZodString;
    mcpVersion: z.ZodLiteral<"1.0">;
    result: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    contextUpdate: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        details?: Record<string, unknown> | undefined;
    }, {
        code: string;
        message: string;
        details?: Record<string, unknown> | undefined;
    }>>;
    metadata: z.ZodOptional<z.ZodObject<{
        timestamp: z.ZodString;
        processingTime: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        processingTime: number;
    }, {
        timestamp: string;
        processingTime: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    mcpVersion: "1.0";
    requestId: string;
    responseId: string;
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown> | undefined;
    } | undefined;
    metadata?: {
        timestamp: string;
        processingTime: number;
    } | undefined;
    result?: Record<string, unknown> | undefined;
    contextUpdate?: Record<string, unknown> | undefined;
}, {
    mcpVersion: "1.0";
    requestId: string;
    responseId: string;
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown> | undefined;
    } | undefined;
    metadata?: {
        timestamp: string;
        processingTime: number;
    } | undefined;
    result?: Record<string, unknown> | undefined;
    contextUpdate?: Record<string, unknown> | undefined;
}>;
export type MCPContext = z.infer<typeof MCPContextSchema>;
export type MCPRequest = z.infer<typeof MCPRequestSchema>;
export type MCPResponse = z.infer<typeof MCPResponseSchema>;
export type MCPError = z.infer<typeof MCPErrorSchema>;
export declare enum MCPErrorCode {
    BAD_REQUEST = "MCP_400",
    UNAUTHORIZED = "MCP_401",
    FORBIDDEN = "MCP_403",
    NOT_FOUND = "MCP_404",
    INTERNAL_ERROR = "MCP_500",
    SERVICE_UNAVAILABLE = "MCP_503"
}
export declare function isMCPRequest(obj: unknown): obj is MCPRequest;
export declare function isMCPResponse(obj: unknown): obj is MCPResponse;
export interface ModuleRegistrationRequest {
    moduleId: string;
    moduleName: string;
    moduleType: string;
    capabilities: string[];
    mcpEndpoint: string;
    metadata: {
        version: string;
        description?: string;
    };
}
export declare const ModuleRegistrationRequestSchema: z.ZodObject<{
    moduleId: z.ZodString;
    moduleName: z.ZodString;
    moduleType: z.ZodString;
    capabilities: z.ZodArray<z.ZodString, "many">;
    mcpEndpoint: z.ZodString;
    metadata: z.ZodObject<{
        version: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        version: string;
        description?: string | undefined;
    }, {
        version: string;
        description?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    metadata: {
        version: string;
        description?: string | undefined;
    };
    moduleId: string;
    moduleName: string;
    moduleType: string;
    capabilities: string[];
    mcpEndpoint: string;
}, {
    metadata: {
        version: string;
        description?: string | undefined;
    };
    moduleId: string;
    moduleName: string;
    moduleType: string;
    capabilities: string[];
    mcpEndpoint: string;
}>;
export interface ModuleRegistrationResponse {
    registered: boolean;
    moduleId: string;
    coreEndpoint: string;
    sharedSecret?: string;
}
//# sourceMappingURL=mcp.d.ts.map