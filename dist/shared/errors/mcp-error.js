"use strict";
/**
 * MCP-specific error classes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPError = void 0;
class MCPError extends Error {
    code;
    details;
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'MCPError';
    }
}
exports.MCPError = MCPError;
//# sourceMappingURL=mcp-error.js.map