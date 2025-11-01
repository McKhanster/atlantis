# Atlantis Core MCP Server

AI-Native Orchestrator Core - Model Context Protocol Server for Rovo Dev Integration

## Installation

```bash
npm install atlantis-core-mcp
```

## Usage

### As a binary

```bash
npx atlantis-mcp
```

### Programmatically

```typescript
import { AtlantisMcpServer } from 'atlantis-core-mcp';

const server = new AtlantisMcpServer();
await server.start();
```

## Available Tools

- `health_check`: Check server health status
- `list_modules`: List all registered modules
- `register_module`: Register a new module with capabilities

## Development

```bash
npm run build    # Build TypeScript
npm run start    # Start MCP server
npm test         # Run tests
```

## Rovo Dev Integration

This MCP server is designed to integrate with Atlassian Rovo Dev for AI-powered orchestration across Jira and Confluence.

## License

MIT