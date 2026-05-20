/** Central query keys so cache invalidation stays consistent. */
export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    me: (apiBaseUrl: string) =>
      [...queryKeys.auth.all, "me", apiBaseUrl] as const,
  },
  conversations: {
    all: ["conversations"] as const,
    list: (apiBaseUrl: string) =>
      [...queryKeys.conversations.all, "list", apiBaseUrl] as const,
    messages: (apiBaseUrl: string, conversationId: string, limit?: number) =>
      [
        ...queryKeys.conversations.all,
        "messages",
        apiBaseUrl,
        conversationId,
        limit ?? "default",
      ] as const,
  },
  housings: {
    all: ["housings"] as const,
    list: (apiBaseUrl: string, limit: number, offset: number) =>
      [...queryKeys.housings.all, "list", apiBaseUrl, limit, offset] as const,
  },
};
