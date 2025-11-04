/**
 * SessionData - Singleton module for managing session data
 * Provides centralized session storage with map-based data structure
 */

export class SessionData {
    private static instance: SessionData;
    private sessions: Map<string, unknown> = new Map();

    private constructor() {}

    public static getInstance(): SessionData {
        if (!SessionData.instance) {
            SessionData.instance = new SessionData();
        }
        return SessionData.instance;
    }

    public getSessions(): Map<string, unknown> {
        return this.sessions;
    }

    public setSessions(sessions: Map<string, unknown>): void {
        this.sessions = sessions;
    }

    public getSession(key: string): unknown {
        return this.sessions.get(key);
    }

    public setSession(key: string, value: unknown): void {
        this.sessions.set(key, value);
    }

    public hasSession(key: string): boolean {
        return this.sessions.has(key);
    }

    public deleteSession(key: string): boolean {
        return this.sessions.delete(key);
    }

    public clearSessions(): void {
        this.sessions.clear();
    }
}