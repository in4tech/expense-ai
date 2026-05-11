import { useMemo, useState } from 'react';

import { DEFAULT_API_BASE_URL } from '@/src/config/env';
import { sendChatMessage } from '@/src/features/chat/api/send-chat-message';
import { ChatMessage } from '@/src/features/chat/types';

const buildMessage = (role: ChatMessage['role'], content: string): ChatMessage => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role,
  content,
  createdAt: new Date().toISOString(),
});

export const useChat = () => {
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);

  const hasMessages = messages.length > 0;

  const canSend = useMemo(() => {
    return input.trim().length > 0 && !isSending;
  }, [input, isSending]);

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
    setMessages((current) => [...current, userMessage]);

    try {
      const response = await sendChatMessage(apiBaseUrl, content);
      const assistantMessage = buildMessage('assistant', response.reply);
      setMessages((current) => [...current, assistantMessage]);
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
  };

  return {
    apiBaseUrl,
    setApiBaseUrl,
    messages,
    hasMessages,
    input,
    setInput,
    isSending,
    canSend,
    error,
    sendMessage,
    retryLastMessage,
    clearConversation,
  };
};
