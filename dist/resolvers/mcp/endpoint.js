"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
class MockResolver {
    define(_name, _handler) { }
    getDefinitions() { return {}; }
}
const Resolver = MockResolver;
const server_1 = require("../../infrastructure/mcp/server");
// Create server instance
const mcpServer = new server_1.McpForgeServer({
    name: 'atlantis-core',
    version: '1.0.0',
    endpoint: 'https://forge.atlassian.net'
});
const resolver = new Resolver();
resolver.define('mcpQuery', async (req) => {
    const response = await mcpServer.handleRequest(req.payload);
    return response;
});
exports.handler = resolver.getDefinitions();
//# sourceMappingURL=endpoint.js.map