import { readApiErrorDetail, type ApiClient } from '@/src/lib/api';
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

/** Read `text/plain` response body incrementally (matches server StreamingResponse). */
async function readPlainTextStream(
  response: Response,
  onDelta: (chunk: string) => void
): Promise<string> {
  if (!response.body) {
    const text = await response.text();
    if (text) {
      onDelta(text);
    }
    return text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    const chunk = decoder.decode(value, { stream: true });
    if (chunk) {
      full += chunk;
      onDelta(chunk);
    }
  }

  const tail = decoder.decode();
  if (tail) {
    full += tail;
    onDelta(tail);
  }

  return full;
}

export type SendConversationMessageOptions = {
  /** Called for each decoded UTF-8 chunk from the stream. */
  onDelta?: (delta: string) => void;
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
 * POST `/conversations/:id/chat-stream` — response is streamed `text/plain`, not a single JSON body.
 */
export const sendConversationMessage = async (
  client: ApiClient,
  conversationId: string,
  message: string,
  options?: SendConversationMessageOptions
): Promise<ChatResponse> => {
  const path = `/conversations/${encodeURIComponent(conversationId)}/chat-stream`;
  const response = await client.request(path, {
    method: 'POST',
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(readApiErrorDetail(payload, `Send message failed (${response.status}).`));
  }

  const onDelta = options?.onDelta ?? (() => {});
  const reply = await readPlainTextStream(response, onDelta);
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
