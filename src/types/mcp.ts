/**
 * MCP Protocol Type Definitions
 * Official Model Context Protocol types from @modelcontextprotocol/sdk
 *
 * Re-exports official MCP types and adds Atlantis-specific extensions
 * Compatible with @modelcontextprotocol/sdk v1.20.2
 */

import { z } from 'zod';

// Re-export official MCP types
export {
  CallToolRequest,
  CallToolResult,
  GetPromptRequest,
  GetPromptResult,
  ListPromptsRequest,
  ListPromptsResult,
  ListResourcesRequest,
  ListResourcesResult,
  ListToolsRequest,
  ListToolsResult,
  ReadResourceRequest,
  ReadResourceResult,
  JSONRPCRequest,
  JSONRPCResponse,
  JSONRPCError,
  Tool,
  Prompt,
  Resource,
  TextContent,
  ImageContent,
  EmbeddedResource,
} from '@modelcontextprotocol/sdk/types.js';

// Atlantis-specific extensions
export type MCPSource = 'jira' | 'confluence' | 'module';
export type AtlantisRequestType =
  | 'query'
  | 'update'
  | 'register'
  | 'route'
  | 'broadcast'
  | 'connect';

// Zod schemas for Atlantis extensions
export const MCPSourceSchema = z.enum(['jira', 'confluence', 'module']);
export const AtlantisRequestTypeSchema = z.enum([
  'query',
  'update',
  'register',
  'route',
  'broadcast',
  'connect',
]);

export const AtlantisContextSchema = z.object({
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

// Atlantis-specific types
export type AtlantisContext = z.infer<typeof AtlantisContextSchema>;

export enum AtlantisErrorCode {
  BAD_REQUEST = 'ATLANTIS_400',
  UNAUTHORIZED = 'ATLANTIS_401',
  FORBIDDEN = 'ATLANTIS_403',
  NOT_FOUND = 'ATLANTIS_404',
  INTERNAL_ERROR = 'ATLANTIS_500',
  SERVICE_UNAVAILABLE = 'ATLANTIS_503',
}

// Type guards for Atlantis extensions
export function isAtlantisContext(obj: unknown): obj is AtlantisContext {
  const result = AtlantisContextSchema.safeParse(obj);
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
