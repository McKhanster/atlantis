/**
 * Chat - Singleton module for managing chat data
 * Provides centralized chat storage with map-based data structure
 */

export class Chat {
    private static instance: Chat;
    private chats: Map<string, unknown> = new Map();

    private constructor() {}

    public static getInstance(): Chat {
        if (!Chat.instance) {
            Chat.instance = new Chat();
        }
        return Chat.instance;
    }

    public getChats(): Map<string, unknown> {
        return this.chats;
    }

    public setChats(chats: Map<string, unknown>): void {
        this.chats = chats;
    }

    public getChat(key: string): unknown {
        return this.chats.get(key);
    }

    public setChat(key: string, value: unknown): void {
        this.chats.set(key, value);
    }

    public hasChat(key: string): boolean {
        return this.chats.has(key);
    }

    public deleteChat(key: string): boolean {
        return this.chats.delete(key);
    }

    public clearChats(): void {
        this.chats.clear();
    }
}