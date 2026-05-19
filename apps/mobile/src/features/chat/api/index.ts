/**
 * Barrel re-exports for `@/src/features/chat/api/conversation-api`.
 * Implementation is split by concern under the same folder.
 */
export { apiPaths } from '@/src/lib/api/paths';
export type {
  ConversationMessagesPage,
  ConversationSummaryDto,
  GetConversationMessagesOptions,
} from '@/src/features/chat/api/services';
export {
  createConversation,
  deleteConversation,
  getConversationMessages,
  listConversations,
} from '@/src/features/chat/api/services';

export {
  conversationMessagesQueryOptions,
  conversationsListQueryOptions,
} from '@/src/features/chat/api/queries';

export type {
  SendConversationMessageOptions,
  SseContentEvent,
  SseDoneEvent,
  SseErrorEvent,
  SsePayload,
  SseReflectionEvent,
  SseThinkingEvent,
  SseToolCompletedEvent,
  SseToolRunningEvent,
} from '@/src/features/chat/api/conversation-stream';
export { completeAssistantReply, sendConversationMessage } from '@/src/features/chat/api/conversation-stream';

export type { UploadPdfFile, UploadPdfResponse } from '@/src/features/chat/api/conversation-upload';
export { uploadConversationPdf } from '@/src/features/chat/api/conversation-upload';
