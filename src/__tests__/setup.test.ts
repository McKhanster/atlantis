import { describe, it, expect } from '@jest/globals';

describe('Test Environment', () => {
  it('should be configured correctly', () => {
    expect(true).toBe(true);
  });

  it('should support TypeScript', () => {
    const typed: string = 'test';
    expect(typeof typed).toBe('string');
  });

  it('should have proper test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});
