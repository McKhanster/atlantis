# Atlantis Core MCP Server - Product Overview

## Purpose
AI-Native Orchestrator Core serving as a Model Context Protocol (MCP) server for Rovo Dev integration. Enables AI-powered orchestration across Atlassian Jira and Confluence environments through centralized module management and tool execution.

## Value Proposition
- **Centralized AI Orchestration**: Single point of control for AI agents across Atlassian ecosystem
- **Protocol Bridge**: Seamless integration between external AI agents and Rovo Dev through MCP
- **Module Registry**: Dynamic registration and management of AI capabilities and tools
- **Forge Integration**: Native Atlassian Forge app with proper storage and permissions

## Key Features

### Core Capabilities
- **MCP Server**: Standards-compliant Model Context Protocol server implementation
- **Health Monitoring**: Real-time server health checks and status reporting
- **Module Management**: Dynamic registration and listing of AI modules with capabilities
- **Centralized Logging**: Comprehensive logging infrastructure for all operations

### Atlassian Integration
- **Rovo Agent**: AI agent for Forge development assistance with conversation starters
- **Jira Panels**: Custom issue panels for MCP testing and interaction
- **Action Framework**: Forge actions for message logging, MCP queries, and health checks
- **Storage Entities**: Persistent storage for context, module registrations, and prediction cache

### Development Tools
- **TypeScript Support**: Full TypeScript implementation with strict type checking
- **Testing Framework**: Jest-based testing with coverage reporting
- **Linting**: ESLint configuration for code quality
- **Build Pipeline**: Automated build, test, and deployment scripts

## Target Users

### Primary Users
- **AI/ML Engineers**: Building AI agents that need to interact with Atlassian products
- **Forge Developers**: Creating Atlassian apps with AI capabilities
- **DevOps Teams**: Managing AI orchestration in enterprise Atlassian environments

### Use Cases
- **Cross-Platform AI Workflows**: Orchestrating AI tasks across Jira and Confluence
- **Agent Development**: Building and testing AI agents for Atlassian environments  
- **Enterprise AI Integration**: Centralized management of AI capabilities in large organizations
- **Rovo Dev Enhancement**: Extending Rovo Dev capabilities through custom MCP tools

## Architecture Benefits
- **Hybrid Protocol Support**: Planned A2A (Agent-to-Agent) protocol for external agents
- **Security**: All external access mediated through Atlantis Core with proper authentication
- **Scalability**: Modular architecture supporting dynamic capability expansion
- **Compliance**: Runs on Atlassian infrastructure with proper data governance