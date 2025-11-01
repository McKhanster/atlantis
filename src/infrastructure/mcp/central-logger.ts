/**
 * Central Logger - Aggregates all MCP interactions from all instances
 */

import { request } from 'http';

export class CentralLogger {
  private static instance: CentralLogger;
  private instanceId: string;

  private constructor() {
    this.instanceId = process.env.ATLANTIS_INSTANCE_ID || `instance-${Date.now()}`;
  }

  static getInstance(): CentralLogger {
    if (!CentralLogger.instance) {
      CentralLogger.instance = new CentralLogger();
    }
    return CentralLogger.instance;
  }

  async logInteraction(type: string, data: Record<string, unknown>): Promise<void> {
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

      const req = request(options, (res) => {
        // Handle response to ensure request completes
        res.on('data', () => {});
        res.on('end', () => {});
      });
      req.on('error', (error) => {
        console.error(`[CENTRAL_LOG] HTTP Error:`, error);
      });
      req.write(postData);
      req.end();
    } catch (error) {
      console.error(`[CENTRAL_LOG] ${type}:`, JSON.stringify(logEntry));
    }
  }

  static async logInteraction(type: string, data: Record<string, unknown>): Promise<void> {
    return CentralLogger.getInstance().logInteraction(type, data);
  }
}