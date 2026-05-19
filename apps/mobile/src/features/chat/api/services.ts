import { apiPaths, readApiErrorDetail, type ApiClient } from '@/src/lib/api';
import type { ChatConversation, ChatMessage, ChatRole } from '@/src/features/chat/types';

const parseRole = (role: string): ChatRole => (role === 'assistant' ? 'assistant' : 'user');

export type ConversationSummaryDto = {
  id: string;
  title: string;
  updatedAt: string;
};

export const listConversations = async (client: ApiClient): Promise<ChatConversation[]> => {
  const payload = await client.get<unknown>(apiPaths.conversations.root, 'Conversations list failed');
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
  const payload = await client.post<unknown>(apiPaths.conversations.root, {}, 'Create conversation failed');
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

export const deleteConversation = async (client: ApiClient, conversationId: string): Promise<void> => {
  const path = apiPaths.conversations.byId(conversationId);
  const response = await client.request(path, { method: 'DELETE' });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(readApiErrorDetail(payload, `Delete conversation failed (${response.status}).`));
  }
};

export type GetConversationMessagesOptions = {
  limit?: number;
  beforeId?: string;
};

export type ConversationMessagesPage = {
  messages: ChatMessage[];
  hasMore: boolean;
};

export const getConversationMessages = async (
  client: ApiClient,
  conversationId: string,
  options?: GetConversationMessagesOptions,
): Promise<ConversationMessagesPage> => {
  const params = new URLSearchParams();
  if (options?.limit != null) {
    params.set('limit', String(options.limit));
  }
  if (options?.beforeId != null && options.beforeId !== '') {
    params.set('before_id', String(options.beforeId));
  }
  const query = params.toString();
  const path = apiPaths.conversations.messages(conversationId, query || undefined);
  const payload = await client.get<unknown>(path, 'Load messages failed');
  if (!payload || typeof payload !== 'object' || !('messages' in payload)) {
    throw new Error('Invalid messages response.');
  }
  const raw = (payload as { messages: unknown }).messages;
  if (!Array.isArray(raw)) {
    throw new Error('Invalid messages response.');
  }
  const hasMoreRaw = (payload as { hasMore?: unknown }).hasMore;
  const hasMore = typeof hasMoreRaw === 'boolean' ? hasMoreRaw : false;
  const messages = raw.map((row): ChatMessage => {
    if (!row || typeof row !== 'object') {
      return {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        role: 'user',
        content: '',
        metadata: null,
        createdAt: new Date().toISOString(),
      };
    }
    const item = row as Record<string, unknown>;
    return {
      id: String(item.id ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`),
      role: parseRole(String(item.role ?? 'user')),
      content: String(item.content ?? ''),
      metadata: item.metadata && typeof item.metadata === 'object' ? (item.metadata as Record<string, unknown>) : null,
      createdAt: String(item.createdAt ?? new Date().toISOString()),
    };
  });
  return { messages, hasMore };
};
