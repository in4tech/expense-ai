import {
  ChatConversation,
  ChatMessage,
  ChatResponse,
  ChatRole,
} from '@/src/features/chat/types';

const normalizeBaseUrl = (apiBaseUrl: string) => apiBaseUrl.replace(/\/$/, '');

type ApiErrorPayload = { detail?: string };

const readDetail = (payload: unknown, fallback: string): string => {
  if (payload && typeof payload === 'object' && 'detail' in payload) {
    const detail = (payload as ApiErrorPayload).detail;
    if (typeof detail === 'string') {
      return detail;
    }
  }
  return fallback;
};

const parseJson = async (response: Response): Promise<unknown> => {
  return (await response.json().catch(() => null)) as unknown;
};

const parseRole = (role: string): ChatRole => (role === 'assistant' ? 'assistant' : 'user');

export type ConversationSummaryDto = {
  id: string;
  title: string;
  updatedAt: string;
};

export const listConversations = async (apiBaseUrl: string): Promise<ChatConversation[]> => {
  const response = await fetch(`${normalizeBaseUrl(apiBaseUrl)}/conversations`);
  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(readDetail(payload, `Conversations list failed (${response.status}).`));
  }
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

export const createConversation = async (apiBaseUrl: string): Promise<ConversationSummaryDto> => {
  const response = await fetch(`${normalizeBaseUrl(apiBaseUrl)}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(readDetail(payload, `Create conversation failed (${response.status}).`));
  }
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
  apiBaseUrl: string,
  conversationId: string
): Promise<ChatMessage[]> => {
  const response = await fetch(`${normalizeBaseUrl(apiBaseUrl)}/conversations/${conversationId}/messages`);
  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(readDetail(payload, `Load messages failed (${response.status}).`));
  }
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
  apiBaseUrl: string,
  conversationId: string,
  message: string
): Promise<ChatResponse> => {
  const response = await fetch(
    `${normalizeBaseUrl(apiBaseUrl)}/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    }
  );
  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(readDetail(payload, `Send message failed (${response.status}).`));
  }
  if (!payload || typeof payload !== 'object' || typeof (payload as ChatResponse).reply !== 'string') {
    throw new Error('Invalid chat response from server.');
  }
  return payload as ChatResponse;
};

export const completeAssistantReply = async (
  apiBaseUrl: string,
  conversationId: string
): Promise<ChatResponse> => {
  const response = await fetch(
    `${normalizeBaseUrl(apiBaseUrl)}/conversations/${conversationId}/assistant`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }
  );
  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(readDetail(payload, `Retry failed (${response.status}).`));
  }
  if (!payload || typeof payload !== 'object' || typeof (payload as ChatResponse).reply !== 'string') {
    throw new Error('Invalid chat response from server.');
  }
  return payload as ChatResponse;
};
