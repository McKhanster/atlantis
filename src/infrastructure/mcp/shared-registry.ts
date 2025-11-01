/**
 * Shared Module Registry - File-based persistence across MCP server instances
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { ModuleInfo } from './mcp-server.js';

const REGISTRY_FILE = join(process.cwd(), 'atlantis-shared-registry.json');

export class SharedModuleRegistry {
  async getModules(): Promise<ModuleInfo[]> {
    try {
      const data = await fs.readFile(REGISTRY_FILE, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async addModule(module: ModuleInfo): Promise<void> {
    const modules = await this.getModules();
    const existing = modules.findIndex(m => m.moduleId === module.moduleId);
    
    if (existing >= 0) {
      modules[existing] = module;
    } else {
      modules.push(module);
    }
    
    await fs.writeFile(REGISTRY_FILE, JSON.stringify(modules, null, 2));
  }

  async removeModule(moduleId: string): Promise<boolean> {
    const modules = await this.getModules();
    const filtered = modules.filter(m => m.moduleId !== moduleId);
    
    if (filtered.length !== modules.length) {
      await fs.writeFile(REGISTRY_FILE, JSON.stringify(filtered, null, 2));
      return true;
    }
    
    return false;
  }
}