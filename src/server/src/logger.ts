/**
 * Centralized Logging System for MCP Hub
 * Logs all interactions with structured metadata
 */

import { Message, AgentInfo, Conversation } from './models.js';
import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export enum LogEventType {
  // Agent lifecycle
  AGENT_REGISTERED = 'AGENT_REGISTERED',
  AGENT_DISCONNECTED = 'AGENT_DISCONNECTED',
  AGENT_ERROR = 'AGENT_ERROR',

  // Message lifecycle
  MESSAGE_SENT = 'MESSAGE_SENT',
  MESSAGE_DELIVERED = 'MESSAGE_DELIVERED',
  MESSAGE_FAILED = 'MESSAGE_FAILED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',

  // Conversation lifecycle
  CONVERSATION_STARTED = 'CONVERSATION_STARTED',
  CONVERSATION_UPDATED = 'CONVERSATION_UPDATED',
  CONVERSATION_COMPLETED = 'CONVERSATION_COMPLETED',

  // System events
  HUB_STARTED = 'HUB_STARTED',
  HUB_STOPPED = 'HUB_STOPPED',
  SSE_CONNECTED = 'SSE_CONNECTED',
  SSE_DISCONNECTED = 'SSE_DISCONNECTED',

  // MCP Protocol events
  MCP_INITIALIZE = 'MCP_INITIALIZE',
  MCP_TOOL_CALL = 'MCP_TOOL_CALL',
  MCP_TOOL_RESPONSE = 'MCP_TOOL_RESPONSE',
  MCP_ERROR = 'MCP_ERROR',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  eventType: LogEventType;
  message: string;
  metadata?: Record<string, any>;
  agentId?: string;
  conversationId?: string;
  messageId?: string;
  duration?: number; // For tracking operation duration
}

export interface LoggerConfig {
  logToConsole: boolean;
  logToFile: boolean;
  logFilePath?: string;
  logLevel: LogLevel;
  prettyPrint: boolean;
  includeTimestamp: boolean;
  includeStackTrace: boolean;
}

const DEFAULT_CONFIG: LoggerConfig = {
  logToConsole: true,
  logToFile: true,
  logFilePath: './logs/hub.log',
  logLevel: LogLevel.INFO,
  prettyPrint: true,
  includeTimestamp: true,
  includeStackTrace: false,
};

export class HubLogger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private fileStream?: fs.WriteStream;
  private startTime: number;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startTime = Date.now();

    if (this.config.logToFile && this.config.logFilePath) {
      this.initFileLogging();
    }
  }

  private initFileLogging(): void {
    try {
      const logDir = path.dirname(this.config.logFilePath!);

      // Create logs directory if it doesn't exist
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      // Create write stream (append mode)
      this.fileStream = fs.createWriteStream(this.config.logFilePath!, {
        flags: 'a',
        encoding: 'utf8',
      });

      this.log(
        LogLevel.INFO,
        LogEventType.HUB_STARTED,
        `Logging to file: ${this.config.logFilePath}`
      );
    } catch (error) {
      console.error(`Failed to initialize file logging: ${error}`);
      this.config.logToFile = false;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const configLevelIndex = levels.indexOf(this.config.logLevel);
    const currentLevelIndex = levels.indexOf(level);
    return currentLevelIndex >= configLevelIndex;
  }

  private formatLogEntry(entry: LogEntry): string {
    if (this.config.prettyPrint) {
      const parts: string[] = [];

      // Timestamp
      if (this.config.includeTimestamp) {
        parts.push(`[${entry.timestamp}]`);
      }

      // Level with color
      const levelColor = this.getLevelColor(entry.level);
      parts.push(`${levelColor}${entry.level.padEnd(5)}${this.resetColor()}`);

      // Event type with emoji
      const emoji = this.getEventEmoji(entry.eventType);
      parts.push(`${emoji} ${entry.eventType}`);

      // Agent ID if present
      if (entry.agentId) {
        parts.push(`[Agent: ${entry.agentId}]`);
      }

      // Conversation ID if present
      if (entry.conversationId) {
        parts.push(`[Conv: ${entry.conversationId}]`);
      }

      // Message
      parts.push(`- ${entry.message}`);

      // Duration if present
      if (entry.duration !== undefined) {
        parts.push(`(${entry.duration}ms)`);
      }

      let output = parts.join(' ');

      // Metadata on new line
      if (entry.metadata && Object.keys(entry.metadata).length > 0) {
        output += '\n  ' + JSON.stringify(entry.metadata, null, 2).split('\n').join('\n  ');
      }

      return output;
    } else {
      return JSON.stringify(entry);
    }
  }

  private getLevelColor(level: LogLevel): string {
    if (!this.config.prettyPrint) return '';

    switch (level) {
      case LogLevel.DEBUG: return '\x1b[36m'; // Cyan
      case LogLevel.INFO: return '\x1b[32m';  // Green
      case LogLevel.WARN: return '\x1b[33m';  // Yellow
      case LogLevel.ERROR: return '\x1b[31m'; // Red
      default: return '';
    }
  }

  private resetColor(): string {
    return this.config.prettyPrint ? '\x1b[0m' : '';
  }

  private getEventEmoji(eventType: LogEventType): string {
    const emojiMap: Record<LogEventType, string> = {
      [LogEventType.AGENT_REGISTERED]: '✅',
      [LogEventType.AGENT_DISCONNECTED]: '👋',
      [LogEventType.AGENT_ERROR]: '❌',
      [LogEventType.MESSAGE_SENT]: '📤',
      [LogEventType.MESSAGE_DELIVERED]: '📨',
      [LogEventType.MESSAGE_FAILED]: '💥',
      [LogEventType.MESSAGE_RECEIVED]: '📬',
      [LogEventType.CONVERSATION_STARTED]: '💬',
      [LogEventType.CONVERSATION_UPDATED]: '📝',
      [LogEventType.CONVERSATION_COMPLETED]: '✓',
      [LogEventType.HUB_STARTED]: '🚀',
      [LogEventType.HUB_STOPPED]: '🛑',
      [LogEventType.SSE_CONNECTED]: '🔌',
      [LogEventType.SSE_DISCONNECTED]: '🔌',
      [LogEventType.MCP_INITIALIZE]: '🤝',
      [LogEventType.MCP_TOOL_CALL]: '🔧',
      [LogEventType.MCP_TOOL_RESPONSE]: '📋',
      [LogEventType.MCP_ERROR]: '⚠️',
    };

    return emojiMap[eventType] || '📌';
  }

  public log(
    level: LogLevel,
    eventType: LogEventType,
    message: string,
    metadata?: Record<string, any>
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      eventType,
      message,
      metadata,
      agentId: metadata?.agentId,
      conversationId: metadata?.conversationId,
      messageId: metadata?.messageId,
      duration: metadata?.duration,
    };

    // Store in memory
    this.logs.push(entry);

    // Console output
    if (this.config.logToConsole) {
      const formatted = this.formatLogEntry(entry);

      if (level === LogLevel.ERROR) {
        console.error(formatted);
      } else {
        console.log(formatted);
      }
    }

    // File output
    if (this.config.logToFile && this.fileStream) {
      const jsonEntry = JSON.stringify(entry) + '\n';
      this.fileStream.write(jsonEntry);
    }
  }

  // Convenience methods
  public debug(eventType: LogEventType, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, eventType, message, metadata);
  }

  public info(eventType: LogEventType, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, eventType, message, metadata);
  }

  public warn(eventType: LogEventType, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, eventType, message, metadata);
  }

  public error(eventType: LogEventType, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, eventType, message, metadata);
  }

  // Domain-specific logging methods
  public logAgentRegistered(agent: AgentInfo): void {
    this.info(
      LogEventType.AGENT_REGISTERED,
      `Agent registered: ${agent.agent_id}`,
      {
        agentId: agent.agent_id,
        agentType: agent.agent_type,
        version: agent.version,
        capabilities: agent.capabilities,
      }
    );
  }

  public logAgentDisconnected(agentId: string, reason?: string): void {
    this.info(
      LogEventType.AGENT_DISCONNECTED,
      `Agent disconnected: ${agentId}`,
      { agentId, reason }
    );
  }

  public logMessageSent(message: Message): void {
    this.info(
      LogEventType.MESSAGE_SENT,
      `Message sent from ${message.from_agent} to ${message.to_agent}`,
      {
        messageId: message.message_id,
        conversationId: message.conversation_id,
        fromAgent: message.from_agent,
        toAgent: message.to_agent,
        payload: message.payload,
        requiresResponse: message.requires_response,
      }
    );
  }

  public logMessageDelivered(message: Message, queuePosition: number): void {
    this.info(
      LogEventType.MESSAGE_DELIVERED,
      `Message delivered to ${message.to_agent}`,
      {
        messageId: message.message_id,
        conversationId: message.conversation_id,
        toAgent: message.to_agent,
        queuePosition,
      }
    );
  }

  public logConversationStarted(conversation: Conversation): void {
    this.info(
      LogEventType.CONVERSATION_STARTED,
      `Conversation started: ${conversation.conversation_id}`,
      {
        conversationId: conversation.conversation_id,
        participants: conversation.participants,
      }
    );
  }

  public logConversationUpdated(conversation: Conversation): void {
    this.debug(
      LogEventType.CONVERSATION_UPDATED,
      `Conversation updated: ${conversation.conversation_id}`,
      {
        conversationId: conversation.conversation_id,
        messageCount: conversation.messages.length,
        status: conversation.status,
      }
    );
  }

  public logMCPToolCall(toolName: string, agentId?: string, args?: any): void {
    this.info(
      LogEventType.MCP_TOOL_CALL,
      `MCP tool called: ${toolName}`,
      {
        toolName,
        agentId,
        arguments: args,
      }
    );
  }

  public logMCPToolResponse(toolName: string, success: boolean, duration?: number): void {
    this.info(
      LogEventType.MCP_TOOL_RESPONSE,
      `MCP tool response: ${toolName}`,
      {
        toolName,
        success,
        duration,
      }
    );
  }

  public logSSEConnection(agentId: string, connected: boolean): void {
    const eventType = connected ? LogEventType.SSE_CONNECTED : LogEventType.SSE_DISCONNECTED;
    this.info(
      eventType,
      `SSE ${connected ? 'connected' : 'disconnected'}: ${agentId}`,
      { agentId }
    );
  }

  // Query and export methods
  public getLogs(filter?: {
    level?: LogLevel;
    eventType?: LogEventType;
    agentId?: string;
    conversationId?: string;
    since?: Date;
  }): LogEntry[] {
    let filtered = this.logs;

    if (filter) {
      if (filter.level) {
        filtered = filtered.filter(log => log.level === filter.level);
      }
      if (filter.eventType) {
        filtered = filtered.filter(log => log.eventType === filter.eventType);
      }
      if (filter.agentId) {
        filtered = filtered.filter(log => log.agentId === filter.agentId);
      }
      if (filter.conversationId) {
        filtered = filtered.filter(log => log.conversationId === filter.conversationId);
      }
      if (filter.since) {
        filtered = filtered.filter(log => new Date(log.timestamp) >= filter.since!);
      }
    }

    return filtered;
  }

  public getStats(): {
    totalLogs: number;
    byLevel: Record<LogLevel, number>;
    byEventType: Record<string, number>;
    uptime: number;
  } {
    const byLevel: Record<LogLevel, number> = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.ERROR]: 0,
    };

    const byEventType: Record<string, number> = {};

    for (const log of this.logs) {
      byLevel[log.level]++;
      byEventType[log.eventType] = (byEventType[log.eventType] || 0) + 1;
    }

    return {
      totalLogs: this.logs.length,
      byLevel,
      byEventType,
      uptime: Date.now() - this.startTime,
    };
  }

  public clearLogs(): void {
    this.logs = [];
    this.info(LogEventType.HUB_STARTED, 'Logs cleared');
  }

  public close(): void {
    if (this.fileStream) {
      this.fileStream.end();
      this.fileStream = undefined;
    }
  }
}
