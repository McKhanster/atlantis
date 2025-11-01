"use strict";
/**
 * MCP Junction - Routes messages between Amazon Q, Rovo Dev, and modules
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpJunction = void 0;
const server_1 = require("./server");
const crypto_1 = require("crypto");
class McpJunction extends server_1.McpForgeServer {
    connectedClients = new Map();
    constructor(serverInfo) {
        super(serverInfo);
        this.setupJunctionHandlers();
    }
    setupJunctionHandlers() {
        // Route messages between clients
        this.registerHandler('route', async (request) => {
            const { targetClient, message } = request.request.params || {};
            if (!targetClient || !message) {
                throw new Error('Missing targetClient or message');
            }
            // Log the routing
            console.log(`[Junction] Routing from ${request.contextId} to ${targetClient}`);
            return {
                routed: true,
                targetClient,
                messageId: (0, crypto_1.randomUUID)(),
                timestamp: new Date().toISOString()
            };
        });
        // Broadcast to all connected clients
        this.registerHandler('broadcast', async (request) => {
            // Message broadcasting - params available for future use
            console.log(`[Junction] Broadcasting message from ${request.contextId}`);
            console.log(`[Junction] Broadcasting message from ${request.contextId}`);
            return {
                broadcast: true,
                clients: Array.from(this.connectedClients.keys()),
                messageId: (0, crypto_1.randomUUID)()
            };
        });
        // Register client connection
        this.registerHandler('connect', async (request) => {
            const { clientId, clientType } = request.request.params || {};
            this.connectedClients.set(String(clientId), String(clientType));
            console.log(`[Junction] Client connected: ${clientId} (${clientType})`);
            return {
                connected: true,
                clientId,
                totalClients: this.connectedClients.size
            };
        });
    }
    getConnectedClients() {
        return Array.from(this.connectedClients.entries()).map(([id, type]) => ({
            clientId: id,
            clientType: type
        }));
    }
}
exports.McpJunction = McpJunction;
//# sourceMappingURL=junction.js.map