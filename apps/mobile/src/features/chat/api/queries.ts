import { queryOptions } from "@tanstack/react-query";

import {
  getConversationMessages,
  listConversations,
  type GetConversationMessagesOptions,
} from "@/src/features/chat/api/services";
import type { ApiClient } from "@/src/api";
import { queryKeys } from "@/src/query/query-keys";

/** TanStack Query: cacheable conversation list for `useQuery` / `prefetchQuery`. */
export const conversationsListQueryOptions = (client: ApiClient) =>
  queryOptions({
    queryKey: queryKeys.conversations.list(client.baseUrl),
    queryFn: () => listConversations(client),
  });

/** TanStack Query: message history for one thread (e.g. prefetch or `useQuery` when opening a chat). */
export const conversationMessagesQueryOptions = (
  client: ApiClient,
  conversationId: string,
  options?: GetConversationMessagesOptions,
) =>
  queryOptions({
    queryKey: queryKeys.conversations.messages(
      client.baseUrl,
      conversationId,
      options?.limit,
    ),
    queryFn: () => getConversationMessages(client, conversationId, options),
    enabled: conversationId.length > 0,
  });
