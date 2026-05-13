/**
 * Central registry of API path templates used by the mobile app.
 * - Paths are relative to `ApiClient` base URL (leading `/`).
 * - Add new top-level groups (e.g. `auth`, `user`) as features are added.
 */
const conversationsRoot = '/conversations';

export const apiPaths = {
  conversations: {
    root: conversationsRoot,
    chatStream: `${conversationsRoot}/chat-stream`,
    byId: (conversationId: string) => `${conversationsRoot}/${encodeURIComponent(conversationId)}`,
    messages: (conversationId: string, searchQuery?: string) => {
      const base = `${conversationsRoot}/${encodeURIComponent(conversationId)}/messages`;
      return searchQuery ? `${base}?${searchQuery}` : base;
    },
    /** Server route uses raw id in path (same as legacy client). */
    assistant: (conversationId: string) => `${conversationsRoot}/${conversationId}/assistant`,
    uploadPdf: (conversationId: string) =>
      `${conversationsRoot}/${encodeURIComponent(conversationId)}/upload-pdf`,
  },
} as const;
