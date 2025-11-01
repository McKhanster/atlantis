"use strict";
/**
 * Shared Module Registry - File-based persistence across MCP server instances
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedModuleRegistry = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const REGISTRY_FILE = (0, path_1.join)(process.cwd(), 'atlantis-shared-registry.json');
class SharedModuleRegistry {
    async getModules() {
        try {
            const data = await fs_1.promises.readFile(REGISTRY_FILE, 'utf8');
            return JSON.parse(data);
        }
        catch {
            return [];
        }
    }
    async addModule(module) {
        const modules = await this.getModules();
        const existing = modules.findIndex(m => m.moduleId === module.moduleId);
        if (existing >= 0) {
            modules[existing] = module;
        }
        else {
            modules.push(module);
        }
        await fs_1.promises.writeFile(REGISTRY_FILE, JSON.stringify(modules, null, 2));
    }
    async removeModule(moduleId) {
        const modules = await this.getModules();
        const filtered = modules.filter(m => m.moduleId !== moduleId);
        if (filtered.length !== modules.length) {
            await fs_1.promises.writeFile(REGISTRY_FILE, JSON.stringify(filtered, null, 2));
            return true;
        }
        return false;
    }
}
exports.SharedModuleRegistry = SharedModuleRegistry;
//# sourceMappingURL=shared-registry.js.map