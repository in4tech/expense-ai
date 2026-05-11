import { useEffect, useMemo, useState } from 'react';

import { DEFAULT_API_BASE_URL } from '@/src/config/env';
import {
  completeAssistantReply,
  createConversation,
  getConversationMessages,
  listConversations,
  sendConversationMessage,
} from '@/src/features/chat/api/conversation-api';
import { ChatConversation, ChatMessage, ChatResponse } from '@/src/features/chat/types';

const buildMessage = (role: ChatMessage['role'], content: string): ChatMessage => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role,
  content,
  createdAt: new Date().toISOString(),
});

export const useChat = () => {
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);

  const hasMessages = messages.length > 0;

  const canSend = useMemo(() => {
    return input.trim().length > 0 && !isSending;
  }, [input, isSending]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await listConversations(apiBaseUrl);
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
  }, [apiBaseUrl]);

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

  const sendMessage = async (message?: string) => {
    const content = (message ?? input).trim();
    if (!content || isSending) {
      return;
    }

    setError(null);
    setIsSending(true);
    setInput('');

    let conversationId = activeConversationId;

    try {
      if (!conversationId) {
        const created = await createConversation(apiBaseUrl);
        conversationId = created.id;
        setActiveConversationId(conversationId);
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

      const withUserMessage: ChatMessage[] = [...messages, buildMessage('user', content)];
      setMessages(withUserMessage);
      setLastUserMessage(content);
      upsertConversation(conversationId, withUserMessage);

      const response = await sendConversationMessage(apiBaseUrl, conversationId, content);
      const assistantMessage = buildMessage('assistant', response.reply);
      const withAssistantMessage = [...withUserMessage, assistantMessage];
      setMessages(withAssistantMessage);
      upsertConversation(conversationId, withAssistantMessage);
      try {
        const refreshed = await listConversations(apiBaseUrl);
        setConversations(refreshed);
      } catch {
        // keep upserted sidebar row if list refresh fails
      }
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Không thể gửi tin nhắn.');
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

    setError(null);
    setIsSending(true);
    try {
      const remote = await getConversationMessages(apiBaseUrl, activeConversationId);
      const lastRemote = remote[remote.length - 1];

      if (lastRemote?.role === 'assistant') {
        setMessages(remote);
        upsertConversation(activeConversationId, remote);
        try {
          const refreshed = await listConversations(apiBaseUrl);
          setConversations(refreshed);
        } catch {
          // ignore
        }
        return;
      }

      let response: ChatResponse;
      if (lastRemote?.role === 'user' && lastRemote.content === lastUserMessage) {
        response = await completeAssistantReply(apiBaseUrl, activeConversationId);
      } else {
        response = await sendConversationMessage(apiBaseUrl, activeConversationId, lastUserMessage);
      }

      const assistantMessage = buildMessage('assistant', response.reply);
      const withAssistantMessage = [...messages, assistantMessage];
      setMessages(withAssistantMessage);
      upsertConversation(activeConversationId, withAssistantMessage);
      try {
        const refreshed = await listConversations(apiBaseUrl);
        setConversations(refreshed);
      } catch {
        // ignore
      }
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Không thể gửi tin nhắn.');
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
    try {
      const loaded = await getConversationMessages(apiBaseUrl, conversationId);
      setMessages(loaded);
      setActiveConversationId(conversationId);
      setLastUserMessage(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải cuộc trò chuyện.');
    }
  };

  const startNewConversation = () => {
    if (isSending) {
      return;
    }
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
    retryLastMessage,
    loadConversation,
    startNewConversation,
    clearConversation,
  };
};
