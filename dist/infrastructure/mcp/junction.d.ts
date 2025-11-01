/**
 * MCP Junction - Routes messages between Amazon Q, Rovo Dev, and modules
 */
import { McpForgeServer } from './server';
export declare class McpJunction extends McpForgeServer {
    private connectedClients;
    constructor(serverInfo: {
        name: string;
        version: string;
        endpoint: string;
    });
    private setupJunctionHandlers;
    getConnectedClients(): Array<{
        clientId: string;
        clientType: string;
    }>;
}
//# sourceMappingURL=junction.d.ts.map