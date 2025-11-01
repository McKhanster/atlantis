"use strict";
/**
 * Real MCP Server Implementation using @modelcontextprotocol/sdk
 * Replaces the fake MCP implementation with proper SDK integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AtlantisMcpServer = void 0;
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = require("zod");
const http_registry_1 = require("./http-registry");
const health_check_tool_1 = require("../tools/health-check-tool");
const list_modules_tool_1 = require("../tools/list-modules-tool");
/**
 * Atlantis Core MCP Server
 * Provides tools for module registration and health monitoring
 */
class AtlantisMcpServer {
    server;
    registry;
    constructor() {
        this.server = new mcp_js_1.McpServer({
            name: 'atlantis-core',
            version: '1.0.0',
            description: 'AI-Native Orchestrator Core - MCP Server'
        }, {
            capabilities: {
                logging: {},
                tools: {}
            }
        });
        this.registry = new http_registry_1.HttpModuleRegistry();
        this.registerTools();
    }
    registerTools() {
        // Health check tool
        this.server.registerTool('health_check', {
            title: 'Health Check',
            description: 'Check the health status of Atlantis Core',
            inputSchema: {},
            outputSchema: {
                status: zod_1.z.string(),
                timestamp: zod_1.z.string(),
                server: zod_1.z.string(),
                version: zod_1.z.string()
            }
        }, async (data) => {
            const tool = health_check_tool_1.HealthCheckTool.getInstance();
            const mcpResponse = await tool.execute('health-check-' + Date.now());
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(mcpResponse.result, null, 2)
                    }],
                structuredContent: mcpResponse.result
            };
        });
        // List modules tool
        this.server.registerTool('list_modules', {
            title: 'List Modules',
            description: 'List all registered modules in Atlantis Core',
            inputSchema: {},
            outputSchema: {
                modules: zod_1.z.array(zod_1.z.object({
                    moduleId: zod_1.z.string(),
                    moduleName: zod_1.z.string(),
                    capabilities: zod_1.z.array(zod_1.z.string())
                })),
                count: zod_1.z.number(),
                timestamp: zod_1.z.string()
            }
        }, async () => {
            // MCP logging for connected client
            this.server.sendLoggingMessage({
                level: 'info',
                logger: 'atlantis-core',
                data: {
                    interaction: 'LIST_MODULES_REQUEST',
                    source: 'rovo-dev',
                    timestamp: new Date().toISOString()
                }
            });
            console.error('📋 [LIST_MODULES] Rovo Dev requested module list');
            const tool = list_modules_tool_1.ListModulesTool.getInstance();
            const mcpResponse = await tool.execute('list-modules-' + Date.now());
            console.error(`📦 [LIST_MODULES] Using MCP response format`);
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(mcpResponse.result, null, 2)
                    }],
                structuredContent: mcpResponse.result
            };
        });
        // Register module tool
        this.server.registerTool('register_module', {
            title: 'Register Module',
            description: 'Register a new module with Atlantis Core',
            inputSchema: {
                moduleId: zod_1.z.string(),
                moduleName: zod_1.z.string(),
                capabilities: zod_1.z.array(zod_1.z.string()).optional()
            },
            outputSchema: {
                registered: zod_1.z.boolean(),
                moduleId: zod_1.z.string(),
                moduleName: zod_1.z.string(),
                capabilities: zod_1.z.array(zod_1.z.string()),
                timestamp: zod_1.z.string()
            }
        }, async ({ moduleId, moduleName, capabilities }) => {
            // MCP logging for connected client
            this.server.sendLoggingMessage({
                level: 'info',
                logger: 'atlantis-core',
                data: {
                    interaction: 'REGISTER_MODULE_REQUEST',
                    source: 'rovo-dev',
                    moduleId,
                    moduleName,
                    capabilities,
                    timestamp: new Date().toISOString()
                }
            });
            console.error(`📡 [REGISTER_MODULE] Rovo Dev registering: ${moduleId} (${moduleName})`);
            const moduleInfo = {
                moduleId,
                moduleName,
                capabilities: capabilities || []
            };
            await this.registry.addModule(moduleInfo);
            const output = {
                registered: true,
                moduleId,
                moduleName,
                capabilities: moduleInfo.capabilities,
                timestamp: new Date().toISOString()
            };
            console.error(`✅ [REGISTER_MODULE] Successfully registered ${moduleId}`);
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(output, null, 2)
                    }],
                structuredContent: output
            };
        });
        // Singleton tool
        this.server.registerTool('singleton_status', {
            title: 'Singleton Status',
            description: 'Get status from singleton tool instance',
            inputSchema: {},
            outputSchema: {
                toolName: zod_1.z.string(),
                createdAt: zod_1.z.string(),
                callCount: zod_1.z.number(),
                timestamp: zod_1.z.string()
            }
        }, async () => {
            const healthTool = health_check_tool_1.HealthCheckTool.getInstance();
            const status = healthTool.getBaseStatus();
            const output = {
                ...status,
                timestamp: new Date().toISOString()
            };
            console.error(`🔄 [BASE_TOOL] ${status.toolName} call count: ${status.callCount}`);
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(output, null, 2)
                    }],
                structuredContent: output
            };
        });
    }
    /**
     * Start the MCP server with stdio transport
     */
    async start() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        console.error('🚀 Atlantis Core MCP Server running on stdio');
        console.error('📡 Logging all interactions...');
        // Keep the process alive
        return new Promise(() => {
            // This promise never resolves, keeping the server running
        });
    }
    /**
     * Get the underlying MCP server instance
     */
    getServer() {
        return this.server;
    }
    /**
     * Get registered modules
     */
    async getModules() {
        return await this.registry.getModules();
    }
}
exports.AtlantisMcpServer = AtlantisMcpServer;
//# sourceMappingURL=mcp-server.js.map