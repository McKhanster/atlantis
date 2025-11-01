"use strict";
/**
 * Base Tool - Base class that all core tools must inherit from
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTool = void 0;
const crypto_1 = require("crypto");
const central_logger_1 = require("../mcp/central-logger");
class BaseTool {
    createdAt;
    callCount = 0;
    toolName;
    logger = central_logger_1.CentralLogger.getInstance();
    constructor(toolName) {
        this.createdAt = new Date().toISOString();
        this.toolName = toolName;
    }
    logInteraction(type, data) {
        this.logger.logInteraction(type, { tool: this.toolName, ...data });
    }
    incrementCallCount() {
        this.callCount++;
    }
    createMCPResponse(requestId, result, processingStartTime) {
        const response = {
            responseId: (0, crypto_1.randomUUID)(),
            requestId,
            mcpVersion: '1.0',
            result,
            metadata: {
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - processingStartTime
            }
        };
        this.logInteraction('MCP_RESPONSE', { response });
        return response;
    }
    getBaseStatus() {
        return {
            toolName: this.toolName,
            createdAt: this.createdAt,
            callCount: this.callCount
        };
    }
}
exports.BaseTool = BaseTool;
//# sourceMappingURL=base-tool.js.map