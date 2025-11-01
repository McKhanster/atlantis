"use strict";
/**
 * Health Check Tool - Inherits from BaseTool
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthCheckTool = void 0;
const base_tool_1 = require("./base-tool");
class HealthCheckTool extends base_tool_1.BaseTool {
    static instance;
    constructor() {
        super('health_check');
    }
    static getInstance() {
        if (!HealthCheckTool.instance) {
            HealthCheckTool.instance = new HealthCheckTool();
        }
        return HealthCheckTool.instance;
    }
    async execute(requestId = 'health-check') {
        const startTime = Date.now();
        this.incrementCallCount();
        const result = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            server: 'atlantis-core',
            version: '1.0.0'
        };
        return this.createMCPResponse(requestId, result, startTime);
    }
}
exports.HealthCheckTool = HealthCheckTool;
//# sourceMappingURL=health-check-tool.js.map