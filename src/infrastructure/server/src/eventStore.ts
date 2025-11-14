/**
 * Simple in-memory event store for MCP HTTP transport resumability
 * Compatible with MCP SDK's EventStore interface
 */

import { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';

interface StoredEvent {
  id: string;
  message: JSONRPCMessage;
}

export class InMemoryEventStore {
  private events: Map<string, StoredEvent[]> = new Map();
  private eventCounter: number = 0;
  private maxEventsPerSession: number = 1000;

  constructor(maxEventsPerSession: number = 1000) {
    this.maxEventsPerSession = maxEventsPerSession;
  }

  async storeEvent(streamId: string, message: JSONRPCMessage): Promise<string> {
    // Generate a unique event ID
    const eventId = `${Date.now()}-${this.eventCounter++}`;

    if (!this.events.has(streamId)) {
      this.events.set(streamId, []);
    }

    const sessionEvents = this.events.get(streamId)!;
    sessionEvents.push({ id: eventId, message });

    // Keep only the last N events to prevent memory issues
    if (sessionEvents.length > this.maxEventsPerSession) {
      sessionEvents.shift();
    }

    return eventId;
  }

  async replayEventsAfter(
    lastEventId: string,
    { send }: { send: (eventId: string, message: JSONRPCMessage) => Promise<void> }
  ): Promise<string> {
    // For simplicity, we'll use the first session we find
    // In production, you'd want to track which session is making the request
    let lastSentEventId = lastEventId;

    for (const [streamId, sessionEvents] of this.events.entries()) {
      let startIndex = 0;
      if (lastEventId) {
        const lastIndex = sessionEvents.findIndex(e => e.id === lastEventId);
        if (lastIndex !== -1) {
          startIndex = lastIndex + 1;
        }
      }

      // Replay events after the last event ID
      for (let i = startIndex; i < sessionEvents.length; i++) {
        const event = sessionEvents[i];
        await send(event.id, event.message);
        lastSentEventId = event.id;
      }
    }

    return lastSentEventId;
  }

  async clearSession(sessionId: string): Promise<void> {
    this.events.delete(sessionId);
  }

  async clearAllSessions(): Promise<void> {
    this.events.clear();
  }
}
