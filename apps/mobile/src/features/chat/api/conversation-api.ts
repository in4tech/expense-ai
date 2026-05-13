import { readApiErrorDetail, type ApiClient } from '@/src/lib/api';
import EventSource from 'react-native-sse';
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

export const deleteConversation = async (client: ApiClient, conversationId: string): Promise<void> => {
  const path = `/conversations/${encodeURIComponent(conversationId)}`;
  const response = await client.request(path, { method: 'DELETE' });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(readApiErrorDetail(payload, `Delete conversation failed (${response.status}).`));
  }
};

export type GetConversationMessagesOptions = {
  limit?: number;
};

export const getConversationMessages = async (
  client: ApiClient,
  conversationId: string,
  options?: GetConversationMessagesOptions
): Promise<ChatMessage[]> => {
  const params = new URLSearchParams();
  if (options?.limit != null) {
    params.set('limit', String(options.limit));
  }
  const query = params.toString();
  const path = `/conversations/${encodeURIComponent(conversationId)}/messages${query ? `?${query}` : ''}`;
  const payload = await client.getJson<unknown>(path, 'Load messages failed');
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
};

export type SsePayload = {
  type?: string;
  content?: string;
  message?: string;
  tool?: string;
  status?: string;
  iteration?: number;
};

const parseSsePayload = (rawData: string): SsePayload | null => {
  try {
    return JSON.parse(rawData) as SsePayload;
  } catch {
    return null;
  }
};

export type SendConversationMessageOptions = {
  /** Called for each content chunk from SSE stream. */
  onDelta?: (delta: string) => void;
  /** Called for every parsed SSE payload event. */
  onEvent?: (event: SsePayload) => void;
};

export type UploadPdfFile = {
  uri: string;
  name: string;
  mimeType?: string;
};

export type UploadPdfResponse = {
  message: string;
  chunks: number;
};

/**
 * POST `/conversations/chat-stream` — response is streamed `text/event-stream`.
 */
export const sendConversationMessage = async (
  client: ApiClient,
  conversationId: string,
  message: string,
  options?: SendConversationMessageOptions
): Promise<ChatResponse> => {
  const numericConversationId = Number(conversationId);
  if (!Number.isFinite(numericConversationId)) {
    throw new Error('Invalid conversation id.');
  }
  const onDelta = options?.onDelta ?? (() => {});
  const onEvent = options?.onEvent ?? (() => {});

  const reply = await new Promise<string>((resolve, reject) => {
    const streamUrl = client.buildUrl('/conversations/chat-stream');
    let full = '';
    let settled = false;

    const es = new EventSource(streamUrl, {
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: numericConversationId,
        message,
      }),
      pollingInterval: 0,
    });

    const finalize = (error?: Error) => {
      if (settled) {
        return;
      }
      settled = true;
      es.removeAllEventListeners();
      es.close();
      if (error) {
        reject(error);
        return;
      }
      resolve(full);
    };

    es.addEventListener('message', (event) => {
      if (!event.data) {
        return;
      }
      const payload = parseSsePayload(event.data);
      if (!payload) {
        full += event.data;
        onDelta(event.data);
        return;
      }
      onEvent(payload);

      if (payload.type === 'content' && typeof payload.content === 'string') {
        full += payload.content;
        onDelta(payload.content);
        return;
      }

      if (payload.type === 'done') {
        finalize();
        return;
      }

      if (payload.type === 'error') {
        finalize(new Error(payload.message || 'SSE stream error.'));
      }
    });

    es.addEventListener('error', (event) => {
      const reason = 'message' in event && event.message ? event.message : 'SSE connection failed.';
      finalize(new Error(reason));
    });
  });

  return { reply };
};

export const uploadConversationPdf = async (
  client: ApiClient,
  conversationId: string,
  file: UploadPdfFile
): Promise<UploadPdfResponse> => {
  const path = `/conversations/${encodeURIComponent(conversationId)}/upload-pdf`;
  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || 'application/pdf',
  } as unknown as Blob);

  const response = await client.request(path, {
    method: 'POST',
    body: form,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(readApiErrorDetail(payload, `Upload PDF failed (${response.status}).`));
  }
  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof (payload as Record<string, unknown>).message !== 'string'
  ) {
    throw new Error('Invalid upload PDF response.');
  }
  return {
    message: String((payload as Record<string, unknown>).message),
    chunks: Number((payload as Record<string, unknown>).chunks ?? 0),
  };
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
