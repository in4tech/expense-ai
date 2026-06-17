/**
 * Central registry of API path templates used by the mobile app.
 * - Paths are relative to `ApiClient` base URL (leading `/`).
 * - Add new top-level groups (e.g. `auth`, `user`) as features are added.
 */
const conversationsRoot = "/conversations";
const housingsRoot = "/housings";
const imageCaptioningRoot = "/image-captioning";

export const apiPaths = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    me: "/auth/me",
  },
  conversations: {
    root: conversationsRoot,
    /** POST SSE — body `{ message }` only; id is in the path. */
    chatStream: (conversationId: string) =>
      `${conversationsRoot}/${encodeURIComponent(conversationId)}/chat-stream`,
    byId: (conversationId: string) =>
      `${conversationsRoot}/${encodeURIComponent(conversationId)}`,
    messages: (conversationId: string, searchQuery?: string) => {
      const base = `${conversationsRoot}/${encodeURIComponent(conversationId)}/messages`;
      return searchQuery ? `${base}?${searchQuery}` : base;
    },
    /** Server route uses raw id in path (same as legacy client). */
    assistant: (conversationId: string) =>
      `${conversationsRoot}/${conversationId}/assistant`,
    uploadPdf: (conversationId: string) =>
      `${conversationsRoot}/${encodeURIComponent(conversationId)}/upload-pdf`,
  },
  housings: {
    root: housingsRoot,
    byId: (housingId: string) => `${housingsRoot}/${encodeURIComponent(housingId)}`,
    predict: `${housingsRoot}/predict`,
    uploadImages: (housingId: string) =>
      `${housingsRoot}/${encodeURIComponent(housingId)}/upload-multiple`,
  },
  imageCaptioning: {
    predict: `${imageCaptioningRoot}/predict`,
  },
} as const;
