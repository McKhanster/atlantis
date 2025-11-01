// /**
//  * MCP Junction - Routes messages between Amazon Q, Rovo Dev, and modules
//  */

// import { McpForgeServer } from './server';
// import { randomUUID } from 'crypto';

// export class McpJunction extends McpForgeServer {
//   private connectedClients = new Map<string, string>();

//   constructor(serverInfo: { name: string; version: string; endpoint: string }) {
//     super(serverInfo);
//     this.setupJunctionHandlers();
//   }

//   private setupJunctionHandlers(): void {
//     // Route messages between clients
//     this.registerHandler('route', async (request) => {
//       const { targetClient, message } = request.request.params || {};
      
//       if (!targetClient || !message) {
//         throw new Error('Missing targetClient or message');
//       }

//       // Log the routing
//       console.log(`[Junction] Routing from ${request.contextId} to ${targetClient}`);
      
//       return {
//         routed: true,
//         targetClient,
//         messageId: randomUUID(),
//         timestamp: new Date().toISOString()
//       };
//     });

//     // Broadcast to all connected clients
//     this.registerHandler('broadcast', async (request) => {
//       // Message broadcasting - params available for future use
//       console.log(`[Junction] Broadcasting message from ${request.contextId}`);
      
//       console.log(`[Junction] Broadcasting message from ${request.contextId}`);
      
//       return {
//         broadcast: true,
//         clients: Array.from(this.connectedClients.keys()),
//         messageId: randomUUID()
//       };
//     });

//     // Register client connection
//     this.registerHandler('connect', async (request) => {
//       const { clientId, clientType } = request.request.params || {};
      
//       this.connectedClients.set(String(clientId), String(clientType));
//       console.log(`[Junction] Client connected: ${clientId} (${clientType})`);
      
//       return {
//         connected: true,
//         clientId,
//         totalClients: this.connectedClients.size
//       };
//     });
//   }

//   getConnectedClients(): Array<{ clientId: string; clientType: string }> {
//     return Array.from(this.connectedClients.entries()).map(([id, type]) => ({
//       clientId: id,
//       clientType: type
//     }));
//   }
// }