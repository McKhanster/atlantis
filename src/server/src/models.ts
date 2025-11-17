/**
 * Core data models for MCP-based agent communication
 */

import { v4 as uuidv4 } from 'uuid';

export interface Message {
  message_id: string;
  conversation_id: string;
  from_agent: string;
  to_agent: string;
  timestamp: Date;
  payload: Record<string, any>;
  reply_to?: string;
  requires_response: boolean;
}

export function createMessage(
  conversation_id: string,
  from_agent: string,
  to_agent: string,
  payload: Record<string, any>,
  reply_to?: string,
  requires_response: boolean = false
): Message {
  return {
    message_id: `msg_${uuidv4().substring(0, 12)}`,
    conversation_id,
    from_agent,
    to_agent,
    timestamp: new Date(),
    payload,
    reply_to,
    requires_response,
  };
}

export function messageToJsonRpc(message: Message): any {
  return {
    jsonrpc: '2.0',
    method: 'notifications/message',
    params: {
      conversation_id: message.conversation_id,
      message_id: message.message_id,
      from_agent: message.from_agent,
      to_agent: message.to_agent,
      timestamp: message.timestamp.toISOString(),
      payload: message.payload,
      reply_to: message.reply_to,
      requires_response: message.requires_response,
    },
  };
}

export interface Conversation {
  conversation_id: string;
  participants: string[];
  messages: Message[];
  status: 'active' | 'waiting' | 'completed' | 'failed';
  created_at: Date;
  updated_at: Date;
}

export function createConversation(
  conversation_id: string,
  participants: string[]
): Conversation {
  return {
    conversation_id,
    participants,
    messages: [],
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
  };
}

export function addMessageToConversation(
  conversation: Conversation,
  message: Message
): void {
  conversation.messages.push(message);
  conversation.updated_at = new Date();

  if (message.requires_response) {
    conversation.status = 'waiting';
  } else if (!message.requires_response && conversation.status === 'waiting') {
    conversation.status = 'active';
  }
}

export interface AgentCapabilities {
  tools: any[];
  supports_streaming: boolean;
  max_concurrent_tasks: number;
}

export interface AgentInfo {
  agent_id: string;
  agent_type: string;
  version: string;
  status: 'ready' | 'busy' | 'error' | 'offline';
  capabilities: AgentCapabilities;
  registered_at: Date;
  last_heartbeat: Date;
  messages_processed: number;
  errors_encountered: number;
}

export function createAgentInfo(
  agent_id: string,
  agent_type: string,
  version: string = '0.1.0'
): AgentInfo {
  return {
    agent_id,
    agent_type,
    version,
    status: 'ready',
    capabilities: {
      tools: [],
      supports_streaming: false,
      max_concurrent_tasks: 1,
    },
    registered_at: new Date(),
    last_heartbeat: new Date(),
    messages_processed: 0,
    errors_encountered: 0,
  };
}
