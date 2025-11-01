#!/usr/bin/env node
"use strict";
/**
 * Central Log Server - Real-time aggregation of all MCP interactions
 */
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const PORT = process.env.LOG_PORT || 3002;
const logs = [];
const server = (0, http_1.createServer)((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    const url = new URL(req.url, `http://localhost:${PORT}`);
    if (url.pathname === '/log' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const logEntry = JSON.parse(body);
                logs.push(logEntry);
                // Real-time console output
                const { timestamp, instanceId, type, data } = logEntry;
                console.log(`🔥 [${timestamp}] ${instanceId} - ${type}`);
                console.log(`   Data:`, JSON.stringify(data, null, 2));
                console.log('─'.repeat(80));
                res.writeHead(200);
                res.end(JSON.stringify({ logged: true }));
            }
            catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    }
    else if (url.pathname === '/logs' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(logs));
    }
    else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});
server.listen(PORT, () => {
    console.log(`🔥 Central Log Server running on http://localhost:${PORT}`);
    console.log(`📡 Aggregating ALL MCP interactions from ALL instances`);
    console.log('─'.repeat(80));
});
//# sourceMappingURL=log-server.js.map