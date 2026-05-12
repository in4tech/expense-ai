import { useEffect, useMemo, useState } from 'react';

import { DEFAULT_API_BASE_URL } from '@/src/config/env';
import {
  completeAssistantReply,
  createConversation,
  getConversationMessages,
  listConversations,
  sendConversationMessage,
  uploadConversationPdf,
} from '@/src/features/chat/api/conversation-api';
import { createApiClient } from '@/src/lib/api';
import { ChatConversation, ChatMessage, ChatResponse } from '@/src/features/chat/types';

const buildMessage = (role: ChatMessage['role'], content: string): ChatMessage => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role,
  content,
  createdAt: new Date().toISOString(),
});

export const useChat = () => {
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const apiClient = useMemo(() => createApiClient({ baseUrl: apiBaseUrl }), [apiBaseUrl]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);
  /** When true, new messages still sync to the server but the thread is hidden from the recents list. */
  const [temporaryMode, setTemporaryMode] = useState(false);

  const hasMessages = messages.length > 0;

  const canSend = useMemo(() => {
    return input.trim().length > 0 && !isSending;
  }, [input, isSending]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await listConversations(apiClient);
        if (!cancelled) {
          setConversations(rows);
        }
      } catch {
        if (!cancelled) {
          // Offline or server error: keep drawer usable for the current session.
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiClient]);

  const upsertConversation = (conversationId: string, nextMessages: ChatMessage[]) => {
    const firstUserMessage = nextMessages.find((message) => message.role === 'user');
    const title = firstUserMessage ? firstUserMessage.content.slice(0, 40) : 'New conversation';
    const updatedAt = new Date().toISOString();

    setConversations((current) => {
      const existing = current.find((conversation) => conversation.id === conversationId);
      const updatedConversation: ChatConversation = {
        id: conversationId,
        title,
        updatedAt,
        messages: nextMessages,
      };

      if (!existing) {
        return [updatedConversation, ...current];
      }

      const others = current.filter((conversation) => conversation.id !== conversationId);
      return [updatedConversation, ...others];
    });
  };

  const ensureConversation = async (hideFromRecents: boolean): Promise<string> => {
    let conversationId = activeConversationId;
    if (!conversationId) {
      const created = await createConversation(apiClient);
      conversationId = created.id;
      setActiveConversationId(conversationId);
      if (!hideFromRecents) {
        setConversations((current) => {
          const next: ChatConversation = {
            id: created.id,
            title: created.title,
            updatedAt: created.updatedAt,
          };
          if (current.some((c) => c.id === created.id)) {
            return [next, ...current.filter((c) => c.id !== created.id)];
          }
          return [next, ...current];
        });
      }
    }
    return conversationId;
  };

  const sendMessage = async (message?: string) => {
    const content = (message ?? input).trim();
    if (!content || isSending) {
      return;
    }

    const hideFromRecents = temporaryMode;

    setError(null);
    setIsSending(true);

    let conversationId = activeConversationId;

    try {
      if (!conversationId) {
        conversationId = await ensureConversation(hideFromRecents);
      }

      const withUserMessage: ChatMessage[] = [...messages, buildMessage('user', content)];
      setMessages(withUserMessage);
      setLastUserMessage(content);
      if (!hideFromRecents) {
        upsertConversation(conversationId, withUserMessage);
      }

      const response = await sendConversationMessage(apiClient, conversationId, content);

      const assistantMessage = buildMessage('assistant', response.reply);
      const withAssistantMessage = [...withUserMessage, assistantMessage];
      setMessages(withAssistantMessage);
      if (!hideFromRecents) {
        upsertConversation(conversationId, withAssistantMessage);
        try {
          const refreshed = await listConversations(apiClient);
          setConversations(refreshed);
        } catch {
          // keep upserted sidebar row if list refresh fails
        }
      }
      setInput('');
    } catch (sendError) {
      const msg = sendError instanceof Error ? sendError.message : 'Không thể gửi tin nhắn.';
      setError(msg);
      throw sendError instanceof Error ? sendError : new Error(msg);
    } finally {
      setIsSending(false);
    }
  };

  const uploadPdf = async (file: { uri: string; name: string; mimeType?: string }) => {
    if (isSending) {
      return;
    }
    const hideFromRecents = temporaryMode;
    setError(null);
    setIsSending(true);
    try {
      const conversationId = await ensureConversation(hideFromRecents);
      await uploadConversationPdf(apiClient, conversationId, file);
      const loaded = await getConversationMessages(apiClient, conversationId);
      setMessages(loaded);
      setLastUserMessage(null);
      if (!hideFromRecents) {
        upsertConversation(conversationId, loaded);
        try {
          const refreshed = await listConversations(apiClient);
          setConversations(refreshed);
        } catch {
          // keep upserted sidebar row if list refresh fails
        }
      }
      setInput('');
    } catch (uploadError) {
      const msg = uploadError instanceof Error ? uploadError.message : 'Không thể tải PDF.';
      setError(msg);
      throw uploadError instanceof Error ? uploadError : new Error(msg);
    } finally {
      setIsSending(false);
    }
  };

  const retryLastMessage = async () => {
    if (!lastUserMessage || isSending || messages.length === 0 || !activeConversationId) {
      return;
    }
    const last = messages[messages.length - 1];
    if (last.role !== 'user' || last.content !== lastUserMessage) {
      return;
    }

    const hideFromRecents = temporaryMode;

    setError(null);
    setIsSending(true);
    try {
      const remote = await getConversationMessages(apiClient, activeConversationId);
      const lastRemote = remote[remote.length - 1];

      if (lastRemote?.role === 'assistant') {
        setMessages(remote);
        if (!hideFromRecents) {
          upsertConversation(activeConversationId, remote);
          try {
            const refreshed = await listConversations(apiClient);
            setConversations(refreshed);
          } catch {
            // ignore
          }
        }
        return;
      }

      let response: ChatResponse;
      if (lastRemote?.role === 'user' && lastRemote.content === lastUserMessage) {
        response = await completeAssistantReply(apiClient, activeConversationId);
      } else {
        response = await sendConversationMessage(apiClient, activeConversationId, lastUserMessage);
      }

      const assistantMessage = buildMessage('assistant', response.reply);
      const withAssistantMessage = [...messages, assistantMessage];
      setMessages(withAssistantMessage);
      if (!hideFromRecents) {
        upsertConversation(activeConversationId, withAssistantMessage);
        try {
          const refreshed = await listConversations(apiClient);
          setConversations(refreshed);
        } catch {
          // ignore
        }
      }
    } catch (sendError) {
      const msg = sendError instanceof Error ? sendError.message : 'Không thể gửi tin nhắn.';
      setError(msg);
      throw sendError instanceof Error ? sendError : new Error(msg);
    } finally {
      setIsSending(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setError(null);
    setLastUserMessage(null);
    setActiveConversationId(null);
  };

  const loadConversation = async (conversationId: string) => {
    if (isSending) {
      return;
    }
    setError(null);
    setTemporaryMode(false);
    try {
      const loaded = await getConversationMessages(apiClient, conversationId);
      setMessages(loaded);
      setActiveConversationId(conversationId);
      setLastUserMessage(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải cuộc trò chuyện.');
    }
  };

  const toggleTemporaryChatMode = () => {
    if (isSending) {
      return;
    }
    setTemporaryMode((v) => !v);
  };

  const discardActiveConversation = () => {
    if (isSending) {
      return;
    }
    const id = activeConversationId;
    if (id) {
      setConversations((current) => current.filter((conversation) => conversation.id !== id));
    }
    setTemporaryMode(false);
    clearConversation();
  };

  const startNewConversation = () => {
    if (isSending) {
      return;
    }
    setTemporaryMode(false);
    clearConversation();
  };

  return {
    apiBaseUrl,
    setApiBaseUrl,
    messages,
    hasMessages,
    conversations,
    activeConversationId,
    input,
    setInput,
    isSending,
    canSend,
    error,
    sendMessage,
    uploadPdf,
    retryLastMessage,
    loadConversation,
    startNewConversation,
    clearConversation,
    temporaryMode,
    toggleTemporaryChatMode,
    discardActiveConversation,
  };
};
