import { ChatResponse } from '@/src/features/chat/types';

export const sendChatMessage = async (apiBaseUrl: string, message: string): Promise<ChatResponse> => {
  const endpoint = `${apiBaseUrl.replace(/\/$/, '')}/chat`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  const payload = (await response.json().catch(() => null)) as ChatResponse | { detail?: string } | null;

  if (!response.ok) {
    const fallbackMessage = `Chat API failed with status ${response.status}.`;
    const detailMessage =
      payload && typeof payload === 'object' && 'detail' in payload && typeof payload.detail === 'string'
        ? payload.detail
        : fallbackMessage;
    throw new Error(detailMessage);
  }

  if (!payload || typeof payload !== 'object' || typeof payload.reply !== 'string') {
    throw new Error('Invalid chat response from server.');
  }

  return payload;
};
