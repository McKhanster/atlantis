/**
 * MCP Validation Layer
 * Validates MCP requests/responses and provides detailed error information
 */

import { z } from 'zod';
import {
  ModuleRegistrationRequestSchema,
  type ModuleRegistrationRequest,
  AtlantisErrorCode,
  CallToolRequest,
  CallToolResult,
} from '../../types/mcp.js';
import { MCPError as MCPErrorClass } from '../../shared/errors/mcp-error.js';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: AtlantisErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Validates a CallToolRequest
 */
export function validateCallToolRequest(obj: unknown): ValidationResult<CallToolRequest> {
  if (typeof obj === 'object' && obj !== null && 'method' in obj && 'params' in obj) {
    return {
      success: true,
      data: obj as CallToolRequest,
    };
  }

  return {
    success: false,
    error: {
      code: AtlantisErrorCode.BAD_REQUEST,
      message: 'Invalid CallToolRequest format',
      details: { received: obj },
    },
  };
}

/**
 * Validates a CallToolResult
 */
export function validateCallToolResult(obj: unknown): ValidationResult<CallToolResult> {
  if (typeof obj === 'object' && obj !== null && 'content' in obj) {
    return {
      success: true,
      data: obj as CallToolResult,
    };
  }

  return {
    success: false,
    error: {
      code: AtlantisErrorCode.INTERNAL_ERROR,
      message: 'Invalid CallToolResult format',
      details: { received: obj },
    },
  };
}

/**
 * Validates a module registration request
 */
export function validateModuleRegistration(
  obj: unknown
): ValidationResult<ModuleRegistrationRequest> {
  const result = ModuleRegistrationRequestSchema.safeParse(obj);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    error: {
      code: AtlantisErrorCode.BAD_REQUEST,
      message: 'Invalid module registration request',
      details: {
        issues: result.error.issues.map((issue: any) => ({
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
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  obj: unknown,
  errorMessage: string
): ValidationResult<T> {
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
      code: AtlantisErrorCode.BAD_REQUEST,
      message: errorMessage,
      details: {
        issues: result.error.issues.map((issue: any) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    },
  };
}

/**
 * Throws an MCPError if validation fails
 */
export function assertValidCallToolRequest(obj: unknown): asserts obj is CallToolRequest {
  const validation = validateCallToolRequest(obj);
  if (!validation.success) {
    throw new MCPErrorClass(
      validation.error!.message,
      validation.error!.code,
      validation.error!.details
    );
  }
}

/**
 * Throws an MCPError if validation fails
 */
export function assertValidCallToolResult(obj: unknown): asserts obj is CallToolResult {
  const validation = validateCallToolResult(obj);
  if (!validation.success) {
    throw new MCPErrorClass(
      validation.error!.message,
      validation.error!.code,
      validation.error!.details
    );
  }
}
