/** Central query keys so cache invalidation stays consistent. */
export const queryKeys = {
  conversations: {
    all: ['conversations'] as const,
    list: (apiBaseUrl: string) => [...queryKeys.conversations.all, 'list', apiBaseUrl] as const,
    messages: (apiBaseUrl: string, conversationId: string, limit?: number) =>
      [...queryKeys.conversations.all, 'messages', apiBaseUrl, conversationId, limit ?? 'default'] as const,
  },
};
