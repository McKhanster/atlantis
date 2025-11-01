# Storage Compliance Update - "Runs on Atlassian" Requirement

**Date**: October 29, 2025
**Status**: CRITICAL UPDATE - Implementation Plan Modified

## Summary

The implementation plan has been updated to ensure full compliance with the "Runs on Atlassian" program requirements. **External/remote storage is prohibited** and will disqualify the app from this $2,000 bonus prize.

## Key Changes

### ❌ REMOVED: External Storage Options
- PostgreSQL via APIs
- External vector databases
- Any remote/third-party storage services

### ✅ MANDATORY: Forge-Hosted Storage Only
- **Forge KVS** (Key-Value Store) via `@forge/kvs`
- **Forge Custom Entities** via `@forge/kvs` entity()
- **Forge SQL** (if complex relational data needed)

## Storage Architecture (Updated)

### Forge KVS Usage
**Purpose**: Simple key-value pairs, caching, configuration

```typescript
import kvs from '@forge/kvs';

// Simple operations
await kvs.set('config.theme', { mode: 'dark' });
const theme = await kvs.get('config.theme');
await kvs.delete('config.theme');

// Query operations
const results = await kvs
  .query()
  .where('key', WhereConditions.beginsWith('cache.'))
  .limit(100)
  .getMany();
```

### Forge Custom Entities Usage
**Purpose**: Structured data with attributes, indexes, and complex queries

```typescript
import kvs, { WhereConditions, Sort } from '@forge/kvs';

// Define entity in manifest.yml first
// Then use in code:

// Create entity
await kvs.entity('erp-context').set('ctx-001', {
  contextId: 'ctx-001',
  source: 'jira',
  entityType: 'issue',
  entityId: 'PROJ-456',
  data: { /* complex nested data */ },
  createdAt: new Date().toISOString(),
  tags: ['procurement', 'urgent']
});

// Query with index
const contexts = await kvs
  .entity('erp-context')
  .query()
  .index('by-source')
  .where(WhereConditions.equals('jira'))
  .sort(Sort.DESC)
  .getMany();

// Complex query
const urgentContexts = await kvs
  .entity('erp-context')
  .query()
  .index('by-tags')
  .where(WhereConditions.contains(['urgent']))
  .getMany();
```

## Manifest Configuration (Required)

### Entity Schema Definition

```yaml
app:
  id: 'ari:cloud:ecosystem::app/your-app-id'
  runtime:
    name: nodejs22.x
  storage:
    entities:
      #  Context Entity
      - key: erp-context
        attributes:
          - name: contextId
            type: string
          - name: source
            type: string
          - name: entityType
            type: string
          - name: entityId
            type: string
          - name: data
            type: any
          - name: createdAt
            type: string
          - name: updatedAt
            type: string
          - name: tags
            type: array
          - name: embeddings
            type: array  # For AI context vectors
        indexes:
          - key: by-source
            attributes: [source, createdAt]
          - key: by-entity
            attributes: [entityType, entityId]
          - key: by-tags
            attributes: [tags]

      # Module Registration Entity
      - key: module-registration
        attributes:
          - name: moduleId
            type: string
          - name: moduleName
            type: string
          - name: moduleType
            type: string
          - name: capabilities
            type: array
          - name: status
            type: string
          - name: registeredAt
            type: string
          - name: metadata
            type: any
        indexes:
          - key: by-type
            attributes: [moduleType]
          - key: by-status
            attributes: [status, registeredAt]

      # AI Prediction Cache Entity
      - key: prediction-cache
        attributes:
          - name: predictionId
            type: string
          - name: contextHash
            type: string
          - name: predictionType
            type: string
          - name: result
            type: any
          - name: confidence
            type: float
          - name: createdAt
            type: string
          - name: expiresAt
            type: string
        indexes:
          - key: by-hash
            attributes: [contextHash]
          - key: by-type
            attributes: [predictionType, createdAt]
          - key: by-expiry
            attributes: [expiresAt]

permissions:
  scopes:
    - storage:app  # REQUIRED for @forge/kvs
```

## AI Context & Vector Embeddings

### Challenge
The original plan considered using external vector databases for AI context and embeddings.

### Solution
Store embeddings as **arrays in Custom Entity attributes**:

```typescript
// Store AI context with embeddings
await kvs.entity('erp-context').set('ctx-001', {
  contextId: 'ctx-001',
  source: 'jira',
  data: { /* structured data */ },
  embeddings: [0.123, 0.456, 0.789, ...], // Vector embedding array
  createdAt: new Date().toISOString()
});

// Query and filter in application code
const contexts = await kvs
  .entity('erp-context')
  .query()
  .index('by-source')
  .getMany();

// Compute similarity in application
const results = contexts.results
  .map(ctx => ({
    context: ctx,
    similarity: cosineSimilarity(queryEmbedding, ctx.value.embeddings)
  }))
  .sort((a, b) => b.similarity - a.similarity)
  .slice(0, 10);
```

## Storage Abstraction Layer (Updated)

### Interface Definition

```typescript
// src/infrastructure/storage/storage-abstraction.ts

import { WhereConditions, Sort } from '@forge/kvs';

export interface QueryFilter {
  index?: string;
  where?: WhereConditions;
  sort?: Sort;
  limit?: number;
  cursor?: string;
}

export interface TransactionOp {
  type: 'set' | 'delete';
  key: string;
  value?: unknown;
}

export interface IStorageService {
  // KVS Operations
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;

  // Entity Operations
  entityGet<T>(entityKey: string, id: string): Promise<T | null>;
  entitySet<T>(entityKey: string, id: string, value: T): Promise<void>;
  entityDelete(entityKey: string, id: string): Promise<void>;

  // Query Operations
  query<T>(entityKey: string, filter: QueryFilter): Promise<{
    results: T[];
    nextCursor?: string;
  }>;

  // Transaction Operations
  transaction<T>(operations: TransactionOp[]): Promise<T>;
}
```

### Implementation

```typescript
// src/infrastructure/storage/forge-storage.ts

import kvs from '@forge/kvs';
import { IStorageService, QueryFilter, TransactionOp } from './storage-abstraction';

export class ForgeStorageService implements IStorageService {
  // KVS Operations
  async get<T>(key: string): Promise<T | null> {
    return await kvs.get(key) as T | null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await kvs.set(key, value);
  }

  async delete(key: string): Promise<void> {
    await kvs.delete(key);
  }

  // Entity Operations
  async entityGet<T>(entityKey: string, id: string): Promise<T | null> {
    return await kvs.entity(entityKey).get(id) as T | null;
  }

  async entitySet<T>(entityKey: string, id: string, value: T): Promise<void> {
    await kvs.entity(entityKey).set(id, value);
  }

  async entityDelete(entityKey: string, id: string): Promise<void> {
    await kvs.entity(entityKey).delete(id);
  }

  // Query Operations
  async query<T>(entityKey: string, filter: QueryFilter): Promise<{
    results: T[];
    nextCursor?: string;
  }> {
    let query = kvs.entity(entityKey).query();

    if (filter.index) {
      query = query.index(filter.index);
    }

    if (filter.where) {
      query = query.where(filter.where);
    }

    if (filter.sort) {
      query = query.sort(filter.sort);
    }

    if (filter.limit) {
      query = query.limit(filter.limit);
    }

    if (filter.cursor) {
      query = query.cursor(filter.cursor);
    }

    const result = await query.getMany();

    return {
      results: result.results.map(r => r.value) as T[],
      nextCursor: result.nextCursor
    };
  }

  // Transaction Operations
  async transaction<T>(operations: TransactionOp[]): Promise<T> {
    return await kvs.transaction(async (tx) => {
      for (const op of operations) {
        if (op.type === 'set') {
          await tx.set(op.key, op.value);
        } else if (op.type === 'delete') {
          await tx.delete(op.key);
        }
      }
    }) as T;
  }
}
```

## Repository Pattern Example

```typescript
// src/domain/services/erp-context-repository.ts

import { IStorageService } from '../../infrastructure/storage/storage-abstraction';
import { WhereConditions, Sort } from '@forge/kvs';

export interface Context {
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

export class ContextRepository {
  private readonly ENTITY_KEY = 'erp-context';

  constructor(private storage: IStorageService) {}

  async create(context: Context): Promise<void> {
    await this.storage.entitySet(this.ENTITY_KEY, context.contextId, context);
  }

  async getById(contextId: string): Promise<Context | null> {
    return await this.storage.entityGet<Context>(this.ENTITY_KEY, contextId);
  }

  async findBySource(source: string, limit: number = 100): Promise<Context[]> {
    const result = await this.storage.query<Context>(this.ENTITY_KEY, {
      index: 'by-source',
      where: WhereConditions.equals(source),
      sort: Sort.DESC,
      limit
    });

    return result.results;
  }

  async findByTags(tags: string[], limit: number = 100): Promise<Context[]> {
    const result = await this.storage.query<Context>(this.ENTITY_KEY, {
      index: 'by-tags',
      where: WhereConditions.contains(tags),
      limit
    });

    return result.results;
  }

  async findSimilarContexts(
    queryEmbedding: number[],
    topK: number = 10
  ): Promise<Context[]> {
    // Get all contexts (or paginate for large datasets)
    const result = await this.storage.query<Context>(this.ENTITY_KEY, {
      limit: 1000
    });

    // Compute similarity in application code
    const withSimilarity = result.results
      .filter(ctx => ctx.embeddings && ctx.embeddings.length > 0)
      .map(ctx => ({
        context: ctx,
        similarity: this.cosineSimilarity(queryEmbedding, ctx.embeddings!)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    return withSimilarity.map(item => item.context);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}
```

## Storage Quotas and Limits

### Forge Storage Limits (Per Installation)
- **KVS Storage**: Limited by platform quotas
- **Custom Entities**: Limited by platform quotas
- **Entry Size**: Maximum size per entry applies
- **Query Limits**: Pagination required for large datasets

See: https://developer.atlassian.com/platform/forge/runtime-reference/storage-api/#quotas-and-limits

## Data Residency

Forge storage automatically inherits Atlassian's data residency features:
- Admin-controlled data location
- Compliance with regional regulations
- No additional configuration needed

## Security

- All data encrypted at rest
- Encrypted in transit
- Partitioned by installation (no cross-site access)
- Disaster recovery backups included
- 28-day retention after uninstall

## Migration from Original Plan

### Before (Original Plan)
```typescript
// ❌ External PostgreSQL
class PostgreSQLService implements IStorageService {
  // Connection to external DB
}

// ❌ External Vector DB
class VectorDBService {
  // Connection to Pinecone/Weaviate/etc
}
```

### After (Updated Plan)
```typescript
// ✅ Forge-hosted only
class ForgeStorageService implements IStorageService {
  // All operations use @forge/kvs
}

// ✅ Embeddings in Custom Entities
const context = {
  embeddings: [0.1, 0.2, 0.3, ...], // Stored as array attribute
};
```

## Impact on Implementation Timeline

### No Timeline Changes Required
- Forge storage is simpler than external DB setup
- No need for API authentication/networking to external services
- Better integration with Forge platform
- **Maintains "Runs on Atlassian" compliance**

### Benefits
✅ Faster development (no external service setup)
✅ Lower complexity (fewer moving parts)
✅ Better security (no external API keys)
✅ Automatic data residency compliance
✅ Simplified deployment (no external dependencies)
✅ **Qualifies for "Runs on Atlassian" $2,000 bonus**

## Testing Considerations

### Unit Tests
Mock `@forge/kvs` module:

```typescript
jest.mock('@forge/kvs', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    entity: jest.fn(() => ({
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      query: jest.fn(() => ({
        index: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue({ results: [], nextCursor: undefined })
      }))
    }))
  }
}));
```

### Integration Tests
- Test against actual Forge storage in development environment
- Verify quota limits
- Test pagination with large datasets
- Benchmark performance

## References

- **Forge Storage API**: https://developer.atlassian.com/platform/forge/runtime-reference/storage-api/
- **Runs on Atlassian Program**: https://developer.atlassian.com/platform/marketplace/runs-on-atlassian/
- **Custom Entities Guide**: https://developer.atlassian.com/platform/forge/custom-entities-store-structured-data/
- **Storage Quotas**: https://developer.atlassian.com/platform/forge/runtime-reference/storage-api/#quotas-and-limits

---

**Status**: ✅ Implementation plan updated
**Compliance**: ✅ "Runs on Atlassian" compliant
**Action Required**: Proceed with implementation using Forge-hosted storage only
