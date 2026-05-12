import type { ApiClient } from '@/src/lib/api';
import {
  ChatConversation,
  ChatMessage,
  ChatResponse,
  ChatRole,
} from '@/src/features/chat/types';

const parseRole = (role: string): ChatRole => (role === 'assistant' ? 'assistant' : 'user');

export type ConversationSummaryDto = {
  id: string;
  title: string;
  updatedAt: string;
};

export const listConversations = async (client: ApiClient): Promise<ChatConversation[]> => {
  const payload = await client.getJson<unknown>('/conversations', 'Conversations list failed');
  if (!payload || typeof payload !== 'object' || !('conversations' in payload)) {
    throw new Error('Invalid conversations list response.');
  }
  const raw = (payload as { conversations: unknown }).conversations;
  if (!Array.isArray(raw)) {
    throw new Error('Invalid conversations list response.');
  }
  return raw.map((row): ChatConversation => {
    if (!row || typeof row !== 'object') {
      return { id: '', title: 'Conversation', updatedAt: new Date().toISOString() };
    }
    const item = row as Record<string, unknown>;
    return {
      id: String(item.id ?? ''),
      title: String(item.title ?? 'Conversation'),
      updatedAt: String(item.updatedAt ?? new Date().toISOString()),
    };
  });
};

export const createConversation = async (client: ApiClient): Promise<ConversationSummaryDto> => {
  const payload = await client.postJson<unknown>('/conversations', {}, 'Create conversation failed');
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid create conversation response.');
  }
  const item = payload as Record<string, unknown>;
  return {
    id: String(item.id ?? ''),
    title: String(item.title ?? 'New conversation'),
    updatedAt: String(item.updatedAt ?? new Date().toISOString()),
  };
};

export const getConversationMessages = async (
  client: ApiClient,
  conversationId: string
): Promise<ChatMessage[]> => {
  const payload = await client.getJson<unknown>(
    `/conversations/${conversationId}/messages`,
    'Load messages failed'
  );
  if (!payload || typeof payload !== 'object' || !('messages' in payload)) {
    throw new Error('Invalid messages response.');
  }
  const raw = (payload as { messages: unknown }).messages;
  if (!Array.isArray(raw)) {
    throw new Error('Invalid messages response.');
  }
  return raw.map((row): ChatMessage => {
    if (!row || typeof row !== 'object') {
      return {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        role: 'user',
        content: '',
        createdAt: new Date().toISOString(),
      };
    }
    const item = row as Record<string, unknown>;
    return {
      id: String(item.id ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`),
      role: parseRole(String(item.role ?? 'user')),
      content: String(item.content ?? ''),
      createdAt: String(item.createdAt ?? new Date().toISOString()),
    };
  });
};

export const sendConversationMessage = async (
  client: ApiClient,
  conversationId: string,
  message: string
): Promise<ChatResponse> => {
  const payload = await client.postJson<unknown>(
    `/conversations/${conversationId}/messages`,
    { message },
    'Send message failed'
  );
  if (!payload || typeof payload !== 'object' || typeof (payload as ChatResponse).reply !== 'string') {
    throw new Error('Invalid chat response from server.');
  }
  return payload as ChatResponse;
};

export const completeAssistantReply = async (
  client: ApiClient,
  conversationId: string
): Promise<ChatResponse> => {
  const payload = await client.postJson<unknown>(
    `/conversations/${conversationId}/assistant`,
    {},
    'Retry failed'
  );
  if (!payload || typeof payload !== 'object' || typeof (payload as ChatResponse).reply !== 'string') {
    throw new Error('Invalid chat response from server.');
  }
  return payload as ChatResponse;
};
