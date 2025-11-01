/**
 * HTTP API Sync Module Registry - Distributed state across MCP server instances
 */

import { ModuleInfo } from './mcp-server.js';

const REGISTRY_API_URL = process.env.ATLANTIS_REGISTRY_URL || 'http://localhost:3001/api/modules';

export class HttpModuleRegistry {
  async getModules(): Promise<ModuleInfo[]> {
    try {
      const response = await fetch(REGISTRY_API_URL);
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  async addModule(module: ModuleInfo): Promise<void> {
    try {
      await fetch(REGISTRY_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(module)
      });
    } catch (error) {
      console.error('Failed to register module:', error);
    }
  }

  async removeModule(moduleId: string): Promise<boolean> {
    try {
      const response = await fetch(`${REGISTRY_API_URL}/${moduleId}`, {
        method: 'DELETE'
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}