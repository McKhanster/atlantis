/**
 * Central Logger - Aggregates all MCP interactions from all instances
 */
export declare class CentralLogger {
    private static instance;
    private instanceId;
    private constructor();
    static getInstance(): CentralLogger;
    logInteraction(type: string, data: Record<string, unknown>): Promise<void>;
    static logInteraction(type: string, data: Record<string, unknown>): Promise<void>;
}
//# sourceMappingURL=central-logger.d.ts.map