# Atlantis MCP Client

A CLI-based MCP (Model Context Protocol) client for connecting to and interacting with MCP servers.

## Features

- Connect to any MCP server (Node.js or Python)
- List available tools
- Call tools with arguments (JSON or key=value format)
- Interactive CLI interface
- Proper error handling and cleanup

## Installation

```bash
cd client
npm install
npm run build
```

## Usage

### Basic Usage

```bash
npm run start <server_command> [server_args...]
```

### Examples

Connect to the Atlantis Core MCP server:
```bash
npm run start node ../dist/index.js
```

Connect to a Python MCP server:
```bash
npm run start python server.py
```

### Interactive Commands

Once connected, you can use these commands:

- `tools` - List all available tools
- `call <tool_name> [args]` - Call a tool with optional arguments
- `help` - Show help information
- `quit` - Exit the client

### Argument Formats

Arguments can be provided in two formats:

**JSON format:**
```
call health_check {"requestId": "test-123"}
```

**Key=value format:**
```
call register_module moduleId=test-module moduleName="Test Module" capabilities=["test"]
```

## Example Session

```
🔌 Connecting to MCP server: node ../dist/index.js
✅ Connected to MCP server

🛠️  Available tools:
  1. health_check
     Description: Check the health status of Atlantis Core

  2. list_modules
     Description: List all registered modules in Atlantis Core

  3. register_module
     Description: Register a new module with Atlantis Core

🚀 MCP Client Started!
> call health_check
🔧 Calling tool: health_check
📝 Arguments: {}
✅ Tool result:
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"status\": \"healthy\",\n  \"timestamp\": \"2025-11-01T01:45:00.000Z\",\n  \"server\": \"atlantis-core\",\n  \"version\": \"1.0.0\"\n}"
    }
  ]
}
> quit
👋 Goodbye!
```

## Development

```bash
# Build TypeScript
npm run build

# Run in development mode
npm run dev
```