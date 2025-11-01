/**
 * Atlantis A2A Server using A2A SDK
 */

import express from "express";
import { v4 as uuidv4 } from "uuid";
import type { AgentCard, Message } from "@a2a-js/sdk";
import {
  AgentExecutor,
  RequestContext,
  ExecutionEventBus,
  DefaultRequestHandler,
  InMemoryTaskStore,
} from "@a2a-js/sdk/server";
import { A2AExpressApp } from "@a2a-js/sdk/server/express";
import { CentralLogger } from '../mcp/central-logger.js';

// Atlantis Agent Card
const atlantisAgentCard: AgentCard = {
  name: "Atlantis Core Orchestrator",
  description: "AI-Native orchestrator for Atlassian environments with MCP bridge to Rovo Dev",
  protocolVersion: "0.3.0",
  version: "1.0.0",
  url: "http://localhost:4000/",
  skills: [
    { 
      id: "jira-management", 
      name: "Jira Operations", 
      description: "Create and manage Jira tickets and projects",
      tags: ["jira", "tickets", "issues", "projects"] 
    },
    { 
      id: "confluence-content", 
      name: "Confluence Content", 
      description: "Create and manage Confluence pages and spaces",
      tags: ["confluence", "docs", "pages", "spaces"] 
    },
    { 
      id: "cross-platform", 
      name: "Cross-Platform Workflows", 
      description: "Orchestrate workflows across Jira and Confluence",
      tags: ["automation", "orchestration", "integration"] 
    }
  ],
  capabilities: {
    streaming: true,
    pushNotifications: true,
    stateTransitionHistory: true,
  },
  defaultInputModes: ["text/plain"],
  defaultOutputModes: ["text/plain"]
};

// Atlantis Task Executor implementing A2A SDK interface
export class AtlantisTaskExecutor implements AgentExecutor {
  async execute(
    requestContext: RequestContext,
    eventBus: ExecutionEventBus
  ): Promise<void> {
    
    const firstPart = requestContext.userMessage?.parts?.[0];
    const messageText = firstPart?.kind === 'text' ? firstPart.text : 'No message';
    
    CentralLogger.logInteraction('a2a-task-started', {
      taskId: requestContext.taskId,
      userMessage: messageText,
      timestamp: new Date().toISOString()
    });

    // Create response message
    const responseMessage: Message = {
      kind: "message",
      messageId: uuidv4(),
      role: "agent",
      parts: [{ 
        kind: "text", 
        text: `Hello! I'm Atlantis Core. I received: "${messageText}". I can help with Jira and Confluence tasks via MCP bridge to Rovo Dev.`
      }],
      contextId: requestContext.contextId,
    };

    // Publish the message and signal completion
    eventBus.publish(responseMessage);
    eventBus.finished();

    const responsePart = responseMessage.parts[0];
    const responseText = responsePart.kind === 'text' ? responsePart.text : 'Response sent';
    
    CentralLogger.logInteraction('a2a-task-completed', {
      taskId: requestContext.taskId,
      response: responseText,
      timestamp: new Date().toISOString()
    });
  }
  
  // Simple cancelTask implementation
  cancelTask = async (taskId: string, eventBus: ExecutionEventBus): Promise<void> => {
    CentralLogger.logInteraction('a2a-task-cancelled', {
      taskId,
      timestamp: new Date().toISOString()
    });
  };
}

// Atlantis A2A Server class
export class AtlantisA2AServer {
  private server: any = null;
  private app: any;

  constructor() {
    // Set up A2A server using SDK
    const agentExecutor = new AtlantisTaskExecutor();
    const requestHandler = new DefaultRequestHandler(
      atlantisAgentCard,
      new InMemoryTaskStore(),
      agentExecutor
    );

    const appBuilder = new A2AExpressApp(requestHandler);
    this.app = appBuilder.setupRoutes(express());

    // Add custom health endpoint
    this.app.get('/health', (req: any, res: any) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });
  }

  async start(port: number = 4000): Promise<void> {
    CentralLogger.logInteraction('a2a-server-starting', {
      port,
      agentName: atlantisAgentCard.name,
      timestamp: new Date().toISOString()
    });

    this.server = this.app.listen(port, () => {
      CentralLogger.logInteraction('a2a-server-started', {
        port,
        url: `http://localhost:${port}`,
        agentCardUrl: `http://localhost:${port}/.well-known/agent-card.json`,
        timestamp: new Date().toISOString()
      });

      console.log(`🚀 Atlantis A2A Server started on http://localhost:${port}`);
      console.log(`📋 Agent Card: http://localhost:${port}/.well-known/agent-card.json`);
    });
  }

  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          CentralLogger.logInteraction('a2a-server-stopped', {
            timestamp: new Date().toISOString()
          });
          console.log('🛑 Atlantis A2A Server stopped');
          resolve();
        });
      });
    }
  }

  getStatus(): { running: boolean; port?: number } {
    return {
      running: this.server !== null,
      port: this.server?.address()?.port
    };
  }
}