"use strict";
/**
 * Central Logger - Aggregates all MCP interactions from all instances
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CentralLogger = void 0;
const http_1 = require("http");
class CentralLogger {
    static instance;
    instanceId;
    constructor() {
        this.instanceId = process.env.ATLANTIS_INSTANCE_ID || `instance-${Date.now()}`;
    }
    static getInstance() {
        if (!CentralLogger.instance) {
            CentralLogger.instance = new CentralLogger();
        }
        return CentralLogger.instance;
    }
    async logInteraction(type, data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            instanceId: this.instanceId,
            type,
            data
        };
        try {
            const postData = JSON.stringify(logEntry);
            const options = {
                hostname: 'localhost',
                port: 3002,
                path: '/log',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };
            const req = (0, http_1.request)(options, (res) => {
                // Handle response to ensure request completes
                res.on('data', () => { });
                res.on('end', () => { });
            });
            req.on('error', (error) => {
                console.error(`[CENTRAL_LOG] HTTP Error:`, error);
            });
            req.write(postData);
            req.end();
        }
        catch (error) {
            console.error(`[CENTRAL_LOG] ${type}:`, JSON.stringify(logEntry));
        }
    }
    static async logInteraction(type, data) {
        return CentralLogger.getInstance().logInteraction(type, data);
    }
}
exports.CentralLogger = CentralLogger;
//# sourceMappingURL=central-logger.js.map