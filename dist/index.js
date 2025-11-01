#!/usr/bin/env node
"use strict";
/**
 * Atlantis Core MCP Server Entry Point
 * Main executable for the MCP server
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AtlantisMcpServer = void 0;
const mcp_server_js_1 = require("./infrastructure/mcp/mcp-server.js");
async function main() {
    const server = new mcp_server_js_1.AtlantisMcpServer();
    await server.start();
}
// Always run when imported as CLI
main().catch(console.error);
// Export for programmatic use
var mcp_server_js_2 = require("./infrastructure/mcp/mcp-server.js");
Object.defineProperty(exports, "AtlantisMcpServer", { enumerable: true, get: function () { return mcp_server_js_2.AtlantisMcpServer; } });
__exportStar(require("./types/index.js"), exports);
//# sourceMappingURL=index.js.map