# Rovo Dev MCP Integration Setup

## Quick Setup

1. **Copy MCP config to Rovo Dev directory:**
```bash
mkdir -p ~/.config/rovo-dev
cp /home/esel/Documents/atlantis/mcp-config.json ~/.config/rovo-dev/
```

2. **Alternative: Direct config in Rovo Dev settings:**
```json
{
  "mcpServers": {
    "atlantis-core": {
      "command": "./start-mcp.sh",
      "args": [],
      "cwd": "/home/esel/Documents/atlantis"
    }
  }
}
```

3. **Test the connection:**
```bash
# Start MCP server manually to test
cd /home/esel/Documents/atlantis
./start-mcp.sh
# OR
npm start
```

## Available Tools

- `health_check`: Check server health status
- `list_modules`: List all registered modules  
- `register_module`: Register a new module with capabilities

## Usage in Rovo Dev

Once configured, you can use these tools in Rovo Dev:

```
@atlantis-core health_check
@atlantis-core list_modules
@atlantis-core register_module moduleId="test-module" moduleName="Test Module"
```

## Architecture

- **Entry Point**: `dist/index.js` (was `dist/tools/mcp-server-proper.js`)
- **Core Server**: `src/infrastructure/mcp/mcp-server.ts`
- **HTTP Registry**: Shared state across all MCP instances

## Troubleshooting

- Ensure the path `/home/esel/Documents/atlantis` is correct
- Make sure `npm run build` has been run
- Check that `dist/index.js` exists after build
- **Fixed**: Server now stays alive for MCP connections
- For shared state, start registry server: `npm run registry`

## Connection Status

✅ **MCP server connects successfully** (logs show proper stdio connection)
✅ **Server stays alive** for tool invocations (fixed with persistent promise)
✅ **Tools available**: health_check, list_modules, register_module

## Latest Fix

## ✅ **RESOLVED: Ubuntu 24 Upgrade**

**Issue**: GLIBC version mismatch
**Solution**: Upgraded from Ubuntu 22 → Ubuntu 24 (includes GLIBC 2.36+)
**Status**: ✅ **MCP SERVER WORKING** - Rovo Dev successfully connected!

## 📊 **Live Interaction Logging**

**Enhanced logging now shows:**
- 🩺 Health check requests
- 📋 Module list requests  
- 📡 Module registration events
- ✅ All responses with timestamps

**Recent interaction:**
```
🩺 [HEALTH_CHECK] Rovo Dev requested health status
✅ [HEALTH_CHECK] Responding: healthy
```