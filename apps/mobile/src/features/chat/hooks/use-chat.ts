import { useMemo, useState } from 'react';

import { DEFAULT_API_BASE_URL } from '@/src/config/env';
import { sendChatMessage } from '@/src/features/chat/api/send-chat-message';
import { ChatConversation, ChatMessage } from '@/src/features/chat/types';

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
    setLastUserMessage(content);

    const userMessage = buildMessage('user', content);
    const conversationId = activeConversationId ?? `conv-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const withUserMessage = [...messages, userMessage];
    setMessages(withUserMessage);
    setActiveConversationId(conversationId);
    upsertConversation(conversationId, withUserMessage);

    try {
      const response = await sendChatMessage(apiBaseUrl, content);
      const assistantMessage = buildMessage('assistant', response.reply);
      const withAssistantMessage = [...withUserMessage, assistantMessage];
      setMessages(withAssistantMessage);
      upsertConversation(conversationId, withAssistantMessage);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Không thể gửi tin nhắn.');
    } finally {
      setIsSending(false);
    }
  };

  const retryLastMessage = async () => {
    if (!lastUserMessage || isSending) {
      return;
    }
    await sendMessage(lastUserMessage);
  };

  const clearConversation = () => {
    setMessages([]);
    setError(null);
    setLastUserMessage(null);
    setActiveConversationId(null);
  };

  const loadConversation = (conversationId: string) => {
    const targetConversation = conversations.find((conversation) => conversation.id === conversationId);
    if (!targetConversation || isSending) {
      return;
    }

    setMessages(targetConversation.messages);
    setActiveConversationId(targetConversation.id);
    setError(null);
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
