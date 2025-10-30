/**
 * Global test setup for Jest
 * Mocks Forge modules that aren't available in test environment
 */

import { jest } from '@jest/globals';

// Mock @forge/api (not installed yet, but will be used)
jest.mock('@forge/api', () => ({
  fetch: jest.fn(),
  route: jest.fn(),
}));

// Mock @forge/bridge (for frontend tests)
jest.mock('@forge/bridge', () => ({
  invoke: jest.fn(),
  view: {
    getContext: jest.fn(),
  },
}));

// Mock @forge/kvs (for storage tests)
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
        cursor: jest.fn().mockReturnThis(),
        getMany: jest.fn<() => Promise<{ results: unknown[]; nextCursor?: string }>>().mockResolvedValue({ results: [], nextCursor: undefined }),
      })),
    })),
    transaction: jest.fn(),
  },
  WhereConditions: {
    equals: jest.fn(),
    contains: jest.fn(),
    beginsWith: jest.fn(),
    greaterThan: jest.fn(),
    lessThan: jest.fn(),
  },
  Sort: {
    ASC: 'ASC',
    DESC: 'DESC',
  },
}));
