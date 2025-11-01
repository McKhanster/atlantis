# AI-Native Orchestrator Modular Suite (AIMS)

## Project Purpose
AIMS is a modular, AI-native extension suite built on Atlassian's Forge platform for the Codegeist 2025 hackathon. The project creates an intelligent orchestration layer that enables business teams to leverage AI capabilities across Jira and Confluence through pluggable modules.

## Value Proposition
- **AI-Native Architecture**: Built from the ground up with AI orchestration at its core
- **Modular Design**: Pluggable modules for different business functions (inventory, vendor management, etc.)
- **Seamless Integration**: Native Atlassian platform integration with Rovo agent capabilities
- **Business Team Focus**: Designed specifically for operation-focused teams (marketing, finance, HR, procurement)

## Key Features

### Core Orchestrator
- **Rovo Agent Integration**: Central AI agent that coordinates all module interactions
- **MCP Communication Layer**: Model Context Protocol for standardized module communication
- **Context Management**: Intelligent context sharing and AI embedding storage
- **Module Registry**: Dynamic registration and discovery of pluggable modules

### Communication Protocol
- **MCP over HTTPS/REST**: Standardized protocol for inter-module communication
- **Forge Invocation Token Authentication**: Secure JWT-based authentication
- **Context Propagation**: Intelligent context sharing between modules and core
- **Real-time Updates**: Live synchronization of data and AI insights

### Storage Architecture
- **Forge-Hosted Storage**: Compliant with "Runs on Atlassian" requirements
- **Custom Entities**: Structured data storage with indexing and querying
- **AI Embedding Storage**: Vector embeddings stored as arrays in entity attributes
- **Prediction Caching**: Intelligent caching of AI predictions and results

## Target Users

### Primary Users
- **Business Operations Teams**: Marketing, finance, HR, procurement teams needing AI-powered insights
- **Project Managers**: Teams managing cross-functional projects requiring intelligent coordination
- **Decision Makers**: Leaders needing AI-driven recommendations and analytics

### Use Cases
- **Inventory Optimization**: AI-powered inventory management and demand forecasting
- **Vendor Management**: Intelligent vendor scoring and relationship management
- **Cross-Module Analytics**: Unified insights across different business functions
- **Automated Workflows**: AI-driven process automation and optimization

## Competition Alignment

### Codegeist 2025 Category
- **Primary**: Apps for Business Teams
- **Bonus Prizes**: Best Rovo Apps, Best Apps Built Using Rovo Dev, Best Runs on Atlassian

### Key Innovation
The Model Context Protocol (MCP) implementation enables true modularity while maintaining AI-native communication patterns, allowing for unprecedented flexibility in business team tooling.

## Technical Differentiators
- **Hybrid MCP Implementation**: Combines existing npm MCP libraries with custom Forge adaptations
- **Layered DDD Architecture**: Domain-driven design with clear separation of concerns
- **Type-Safe Communication**: Full TypeScript implementation with strict typing
- **Comprehensive Testing**: 82%+ test coverage with quality gates