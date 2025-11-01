"use strict";
/**
 * HTTP API Sync Module Registry - Distributed state across MCP server instances
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpModuleRegistry = void 0;
const REGISTRY_API_URL = process.env.ATLANTIS_REGISTRY_URL || 'http://localhost:3001/api/modules';
class HttpModuleRegistry {
    async getModules() {
        try {
            const response = await fetch(REGISTRY_API_URL);
            if (!response.ok)
                return [];
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        }
        catch {
            return [];
        }
    }
    async addModule(module) {
        try {
            await fetch(REGISTRY_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(module)
            });
        }
        catch (error) {
            console.error('Failed to register module:', error);
        }
    }
    async removeModule(moduleId) {
        try {
            const response = await fetch(`${REGISTRY_API_URL}/${moduleId}`, {
                method: 'DELETE'
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
}
exports.HttpModuleRegistry = HttpModuleRegistry;
//# sourceMappingURL=http-registry.js.map