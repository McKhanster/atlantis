/**
 * Domain Entity Type Definitions
 */

export interface ERPContext {
  contextId: string;
  source: 'jira' | 'confluence' | 'module';
  entityType: string;
  entityId: string;
  data: Record<string, unknown>;
  embeddings?: number[];
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface ModuleRegistration {
  moduleId: string;
  moduleName: string;
  moduleType: string;
  capabilities: string[];
  status: 'active' | 'inactive';
  registeredAt: string;
  metadata: Record<string, unknown>;
}

export interface PredictionCache {
  predictionId: string;
  contextHash: string;
  predictionType: string;
  result: Record<string, unknown>;
  confidence: number;
  createdAt: string;
  expiresAt: string;
}
