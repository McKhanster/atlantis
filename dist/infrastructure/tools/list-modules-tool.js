"use strict";
/**
 * List Modules Tool - Inherits from BaseTool
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListModulesTool = void 0;
const base_tool_1 = require("./base-tool");
const http_registry_1 = require("../mcp/http-registry");
class ListModulesTool extends base_tool_1.BaseTool {
    static instance;
    registry;
    constructor() {
        super('list_modules');
        this.registry = new http_registry_1.HttpModuleRegistry();
    }
    static getInstance() {
        if (!ListModulesTool.instance) {
            ListModulesTool.instance = new ListModulesTool();
        }
        return ListModulesTool.instance;
    }
    async execute(requestId = 'list-modules') {
        const startTime = Date.now();
        this.incrementCallCount();
        const modules = await this.registry.getModules();
        const result = {
            modules,
            count: modules.length,
            timestamp: new Date().toISOString()
        };
        return this.createMCPResponse(requestId, result, startTime);
    }
}
exports.ListModulesTool = ListModulesTool;
//# sourceMappingURL=list-modules-tool.js.map