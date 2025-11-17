/**
 * Session Manager - Handles MCP session lifecycle, timeouts, and cleanup
 */

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { HubLogger, LogEventType } from './logger.js';

export interface SessionMetadata {
  sessionId: string;
  transport: StreamableHTTPServerTransport;
  createdAt: Date;
  lastActivity: Date;
  clientInfo?: {
    name: string;
    version?: string;
  };
  heartbeatInterval?: NodeJS.Timeout;
  timeoutCheckInterval?: NodeJS.Timeout;
}

export interface SessionManagerConfig {
  sessionTimeout: number; // milliseconds
  heartbeatInterval: number; // milliseconds
  cleanupInterval: number; // milliseconds
}

const DEFAULT_CONFIG: SessionManagerConfig = {
  sessionTimeout: 5 * 60 * 1000, // 5 minutes
  heartbeatInterval: 30 * 1000, // 30 seconds
  cleanupInterval: 60 * 1000, // 1 minute
};

export class SessionManager {
  private sessions: Map<string, SessionMetadata> = new Map();
  private logger: HubLogger;
  private config: SessionManagerConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(logger: HubLogger, config?: Partial<SessionManagerConfig>) {
    this.logger = logger;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanupTimer();
  }

  /**
   * Register a new session
   */
  registerSession(
    sessionId: string,
    transport: StreamableHTTPServerTransport,
    clientInfo?: { name: string; version?: string }
  ): void {
    const now = new Date();
    const metadata: SessionMetadata = {
      sessionId,
      transport,
      createdAt: now,
      lastActivity: now,
      clientInfo,
    };

    this.sessions.set(sessionId, metadata);

    this.logger.info(
      LogEventType.MCP_INITIALIZE,
      `Session registered: ${sessionId} (client: ${clientInfo?.name || 'unknown'})`
    );

    // Set up transport close handler
    transport.onclose = () => {
      this.removeSession(sessionId, 'transport closed');
    };

    // Set up transport error handler
    transport.onerror = (error: Error) => {
      this.logger.error(
        LogEventType.MCP_ERROR,
        `Transport error for session ${sessionId}: ${error.message}`
      );
      // Don't remove session on error - let timeout handle it
    };

    this.logger.debug(
      LogEventType.MCP_INITIALIZE,
      `Total active sessions: ${this.sessions.size}`
    );
  }

  /**
   * Update last activity timestamp for a session
   */
  updateActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  /**
   * Get transport for a session
   */
  getTransport(sessionId: string): StreamableHTTPServerTransport | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.updateActivity(sessionId);
      return session.transport;
    }
    return undefined;
  }

  /**
   * Check if session exists
   */
  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  /**
   * Get all session IDs
   */
  getAllSessionIds(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Get session metadata
   */
  getSessionMetadata(sessionId: string): SessionMetadata | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Remove a session
   */
  removeSession(sessionId: string, reason: string = 'manual'): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    // Remove from map FIRST to prevent circular reference
    this.sessions.delete(sessionId);

    this.logger.info(
      LogEventType.SSE_DISCONNECTED,
      `Session removed: ${sessionId} (reason: ${reason}, total: ${this.sessions.size})`
    );

    // Clear intervals
    if (session.heartbeatInterval) {
      clearInterval(session.heartbeatInterval);
    }
    if (session.timeoutCheckInterval) {
      clearInterval(session.timeoutCheckInterval);
    }

    // Note: We don't call transport.close() here because:
    // 1. The transport's onclose handler will be triggered by the HTTP connection closing
    // 2. Calling close() could cause circular reference (onclose -> removeSession)
    // 3. The transport cleanup is handled by the MCP SDK
  }

  /**
   * Start periodic cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupStaleSessions();
    }, this.config.cleanupInterval);

    // Don't keep process alive for cleanup timer
    this.cleanupTimer.unref();
  }

  /**
   * Clean up stale sessions that have timed out
   */
  private cleanupStaleSessions(): void {
    const now = Date.now();
    const timeoutMs = this.config.sessionTimeout;
    const staleSessions: string[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      const inactiveMs = now - session.lastActivity.getTime();
      if (inactiveMs > timeoutMs) {
        staleSessions.push(sessionId);
      }
    }

    if (staleSessions.length > 0) {
      this.logger.info(
        LogEventType.HUB_STARTED,
        `Cleaning up ${staleSessions.length} stale session(s)`
      );

      for (const sessionId of staleSessions) {
        const session = this.sessions.get(sessionId);
        const inactiveSeconds = Math.floor(
          (now - session!.lastActivity.getTime()) / 1000
        );
        this.removeSession(
          sessionId,
          `timeout (inactive for ${inactiveSeconds}s)`
        );
      }
    }
  }

  /**
   * Get session statistics
   */
  getStats(): {
    total: number;
    oldest: Date | null;
    newest: Date | null;
    avgAgeMs: number;
  } {
    if (this.sessions.size === 0) {
      return { total: 0, oldest: null, newest: null, avgAgeMs: 0 };
    }

    const now = Date.now();
    let oldestDate: Date | null = null;
    let newestDate: Date | null = null;
    let totalAge = 0;

    for (const session of this.sessions.values()) {
      if (!oldestDate || session.createdAt < oldestDate) {
        oldestDate = session.createdAt;
      }
      if (!newestDate || session.createdAt > newestDate) {
        newestDate = session.createdAt;
      }
      totalAge += now - session.createdAt.getTime();
    }

    return {
      total: this.sessions.size,
      oldest: oldestDate,
      newest: newestDate,
      avgAgeMs: totalAge / this.sessions.size,
    };
  }

  /**
   * Shutdown - clean up all sessions
   */
  shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.logger.info(
      LogEventType.HUB_STARTED,
      `Shutting down SessionManager, closing ${this.sessions.size} session(s)`
    );

    // Remove all sessions
    for (const sessionId of Array.from(this.sessions.keys())) {
      this.removeSession(sessionId, 'server shutdown');
    }
  }
}
