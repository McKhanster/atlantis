/**
 * MCP Protocol Type Definitions
 * Model Context Protocol for module-to-core communication
 *
 * This file defines custom MCP types that extend the standard MCP SDK
 * for our ERP-specific use cases while maintaining compatibility with
 * @modelcontextprotocol/sdk v1.20.2
 */

import { z } from 'zod';

// Version and source enums
export type MCPVersion = '1.0';
export type MCPSource = 'jira' | 'confluence' | 'module';
export type MCPRequestType =
  | 'optimizeInventory'
  | 'scoreVendor'
  | 'forecastProcurement'
  | 'analyzeBudget'
  | 'query'
  | 'update'
  | 'register';

// Zod schemas for validation
export const MCPSourceSchema = z.enum(['jira', 'confluence', 'module']);
export const MCPRequestTypeSchema = z.enum([
  'optimizeInventory',
  'scoreVendor',
  'forecastProcurement',
  'analyzeBudget',
  'query',
  'update',
  'register',
]);

// Zod schemas for request/response validation
export const MCPContextSchema = z.object({
  source: MCPSourceSchema,
  data: z.record(z.unknown()),
  metadata: z
    .object({
      timestamp: z.string().datetime(),
      userId: z.string().optional(),
      tenantId: z.string().optional(),
    })
    .optional(),
});

export const MCPRequestSchema = z.object({
  mcpVersion: z.literal('1.0'),
  requestId: z.string().uuid(),
  contextId: z.string(),
  context: MCPContextSchema,
  request: z.object({
    type: MCPRequestTypeSchema,
    params: z.record(z.unknown()).optional(),
  }),
  auth: z
    .object({
      token: z.string(),
    })
    .optional(),
});

export const MCPErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});

export const MCPResponseSchema = z.object({
  responseId: z.string().uuid(),
  requestId: z.string().uuid(),
  mcpVersion: z.literal('1.0'),
  result: z.record(z.unknown()).optional(),
  contextUpdate: z.record(z.unknown()).optional(),
  error: MCPErrorSchema.optional(),
  metadata: z
    .object({
      timestamp: z.string().datetime(),
      processingTime: z.number(),
    })
    .optional(),
});

// TypeScript interfaces inferred from schemas
export type MCPContext = z.infer<typeof MCPContextSchema>;
export type MCPRequest = z.infer<typeof MCPRequestSchema>;
export type MCPResponse = z.infer<typeof MCPResponseSchema>;
export type MCPError = z.infer<typeof MCPErrorSchema>;

export enum MCPErrorCode {
  BAD_REQUEST = 'MCP_400',
  UNAUTHORIZED = 'MCP_401',
  FORBIDDEN = 'MCP_403',
  NOT_FOUND = 'MCP_404',
  INTERNAL_ERROR = 'MCP_500',
  SERVICE_UNAVAILABLE = 'MCP_503',
}

// Type guards using Zod validation
export function isMCPRequest(obj: unknown): obj is MCPRequest {
  const result = MCPRequestSchema.safeParse(obj);
  return result.success;
}

export function isMCPResponse(obj: unknown): obj is MCPResponse {
  const result = MCPResponseSchema.safeParse(obj);
  return result.success;
}

// Module Registration types (for module-to-core handshake)
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

export const ModuleRegistrationRequestSchema = z.object({
  moduleId: z.string(),
  moduleName: z.string(),
  moduleType: z.string(),
  capabilities: z.array(z.string()),
  mcpEndpoint: z.string().url(),
  metadata: z.object({
    version: z.string(),
    description: z.string().optional(),
  }),
});

export interface ModuleRegistrationResponse {
  registered: boolean;
  moduleId: string;
  coreEndpoint: string;
  sharedSecret?: string;
}
