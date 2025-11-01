"use strict";
/**
 * Global test setup for Jest
 * Mocks Forge modules that aren't available in test environment
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// Mock @forge/api (not installed yet, but will be used)
globals_1.jest.mock('@forge/api', () => ({
    fetch: globals_1.jest.fn(),
    route: globals_1.jest.fn(),
}));
// Mock @forge/bridge (for frontend tests)
globals_1.jest.mock('@forge/bridge', () => ({
    invoke: globals_1.jest.fn(),
    view: {
        getContext: globals_1.jest.fn(),
    },
}));
// Mock @forge/kvs (for storage tests)
globals_1.jest.mock('@forge/kvs', () => ({
    __esModule: true,
    default: {
        get: globals_1.jest.fn(),
        set: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
        entity: globals_1.jest.fn(() => ({
            get: globals_1.jest.fn(),
            set: globals_1.jest.fn(),
            delete: globals_1.jest.fn(),
            query: globals_1.jest.fn(() => ({
                index: globals_1.jest.fn().mockReturnThis(),
                where: globals_1.jest.fn().mockReturnThis(),
                sort: globals_1.jest.fn().mockReturnThis(),
                limit: globals_1.jest.fn().mockReturnThis(),
                cursor: globals_1.jest.fn().mockReturnThis(),
                getMany: globals_1.jest.fn().mockResolvedValue({ results: [], nextCursor: undefined }),
            })),
        })),
        transaction: globals_1.jest.fn(),
    },
    WhereConditions: {
        equals: globals_1.jest.fn(),
        contains: globals_1.jest.fn(),
        beginsWith: globals_1.jest.fn(),
        greaterThan: globals_1.jest.fn(),
        lessThan: globals_1.jest.fn(),
    },
    Sort: {
        ASC: 'ASC',
        DESC: 'DESC',
    },
}));
//# sourceMappingURL=setupTests.js.map