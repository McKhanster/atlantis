/**
 * MCP Validation Layer
 * Validates MCP requests/responses and provides detailed error information
 */

import { z } from 'zod';
import {
  MCPRequestSchema,
  MCPResponseSchema,
  ModuleRegistrationRequestSchema,
  type MCPRequest,
  type MCPResponse,
  type ModuleRegistrationRequest,
  MCPErrorCode,
} from '../../types/mcp';
import { MCPError as MCPErrorClass } from '../../shared/errors/mcp-error';

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
export function validateMCPRequest(obj: unknown): ValidationResult<MCPRequest> {
  const result = MCPRequestSchema.safeParse(obj);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    error: {
      code: MCPErrorCode.BAD_REQUEST,
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
export function validateMCPResponse(obj: unknown): ValidationResult<MCPResponse> {
  const result = MCPResponseSchema.safeParse(obj);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    error: {
      code: MCPErrorCode.INTERNAL_ERROR,
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
      code: MCPErrorCode.BAD_REQUEST,
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
      code: MCPErrorCode.BAD_REQUEST,
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
export function assertValidMCPRequest(obj: unknown): asserts obj is MCPRequest {
  const validation = validateMCPRequest(obj);
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
export function assertValidMCPResponse(obj: unknown): asserts obj is MCPResponse {
  const validation = validateMCPResponse(obj);
  if (!validation.success) {
    throw new MCPErrorClass(
      validation.error!.message,
      validation.error!.code,
      validation.error!.details
    );
  }
}
