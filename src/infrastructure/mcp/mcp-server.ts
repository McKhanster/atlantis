// /**
//  * Real MCP Server Implementation using @modelcontextprotocol/sdk
//  * Replaces the fake MCP implementation with proper SDK integration
//  */

// import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
// import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
// import { z } from 'zod';
// import express from 'express';
// import { HealthCheckTool } from '../tools/health-check-tool.js';


// export interface ModuleInfo {
//   moduleId: string;
//   moduleName: string;
//   capabilities: string[];
// }

// const modules = new Map<string, { moduleId: string; moduleName: string; capabilities: string[] }>();


// if (process.env.BRIDGE_MODE === 'true') {
//   const agent1Url = process.env.AGENT1_URL || 'http://localhost:3001/mcp';
//   const agent2Url = process.env.AGENT2_URL || 'http://localhost:3002/mcp';
//   const coreUrl = process.env.CORE_URL;
// }

// // Create single MCP server instance
// const server = new McpServer({
//   name: 'atlantis-core',
//   version: '1.0.0'
// });

// // Register tools directly
// server.registerTool('health_check', {
//   description: 'Check server health status',
//   inputSchema: {
//     requestId: z.string().optional(),
//     includeMetrics: z.boolean().optional()
//   }
// }, async ({ requestId, includeMetrics }) => {
//   const result = {
//     status: 'healthy',
//     timestamp: new Date().toISOString(),
//     server: 'atlantis-core',
//     version: '1.0.0',
//     requestId: requestId || 'auto-generated',
//     metrics: includeMetrics ? { uptime: process.uptime(), memory: process.memoryUsage() } : undefined
//   };
//   const tool = HealthCheckTool.getInstance();
//   const response = await tool.execute(requestId || 'health-check-' + Date.now(), result, { requestId, includeMetrics });
//   return {
//     content: [{ type: 'text', text: JSON.stringify(response) }],
//     structuredContent: response
//   };
// });

// server.registerTool('list_modules', {
//   description: 'List all registered modules',
//   inputSchema: {}
// }, async () => {
//   const moduleList = Array.from(modules.values());
//   const result = {
//     modules: moduleList,
//     count: moduleList.length,
//     timestamp: new Date().toISOString()
//   };
//   return {
//     content: [{ type: 'text', text: JSON.stringify(result) }],
//     structuredContent: result
//   };
// });

// server.registerTool('register_module', {
//   description: 'Register a new module',
//   inputSchema: {
//     moduleId: z.string(),
//     moduleName: z.string(),
//     capabilities: z.array(z.string()).optional()
//   }
// }, async ({ moduleId, moduleName, capabilities }) => {
//   const moduleInfo = {
//     moduleId,
//     moduleName,
//     capabilities: capabilities || []
//   };
//   modules.set(moduleId, moduleInfo);
  
//   const result = {
//     registered: true,
//     ...moduleInfo,
//     timestamp: new Date().toISOString()
//   };
//   return {
//     content: [{ type: 'text', text: JSON.stringify(result) }],
//     structuredContent: result
//   };
// });

// // Register bridge tool if in bridge mode

// export class AtlantisMcpServer {
//   constructor() {}



//   // Start stdio server (default)
//   async start(): Promise<void> {
//     return this.startStdio();
//   }

//   async startStdio(): Promise<void> {
//     const transport = new StdioServerTransport();
//     await server.connect(transport);
//     console.error('🚀 Atlantis MCP Server running on stdio');
//     return new Promise(() => {});
//   }

//   // Start HTTP server
//   async startHttp(port = 3000): Promise<void> {
//     const app = express();
//     app.use(express.json());

//     app.post('/mcp', async (req: any, res: any) => {
//       const transport = new StreamableHTTPServerTransport({
//         sessionIdGenerator: undefined,
//         enableJsonResponse: true
//       });
      
//       res.on('close', () => transport.close());
//       await server.connect(transport);
//       await transport.handleRequest(req, res, req.body);
//     });

//     app.listen(port, () => {
//       console.error(`🚀 Atlantis MCP Server running on http://localhost:${port}/mcp`);
//     });
//   }

//   getServer() { return server; }
// }
