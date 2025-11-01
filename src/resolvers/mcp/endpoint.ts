// Mock Forge resolver for type checking
interface ResolverRequest {
  payload: unknown;
}

class MockResolver {
  define(_name: string, _handler: (req: ResolverRequest) => Promise<unknown>): void {}
  getDefinitions(): Record<string, unknown> { return {}; }
}

const Resolver = MockResolver;

import { McpForgeServer } from '../../infrastructure/mcp/server';

// Create server instance
const mcpServer = new McpForgeServer({
  name: 'atlantis-core',
  version: '1.0.0',
  endpoint: 'https://forge.atlassian.net'
});

const resolver = new Resolver();

resolver.define('mcpQuery', async (req: ResolverRequest) => {
  const response = await mcpServer.handleRequest(req.payload);
  return response;
});

export const handler = resolver.getDefinitions();