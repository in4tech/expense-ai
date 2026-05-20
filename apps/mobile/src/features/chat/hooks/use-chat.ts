import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { DEFAULT_API_BASE_URL } from "@/src/config/env";
import {
  completeAssistantReply,
  conversationsListQueryOptions,
  createConversation,
  deleteConversation,
  getConversationMessages,
  type SsePayload,
  sendConversationMessage,
  uploadConversationPdf,
} from "@/src/features/chat/api";
import { createApiClient } from "@/src/lib/api";
import { queryKeys } from "@/src/query/query-keys";
import {
  ChatConversation,
  ChatMessage,
  ChatResponse,
} from "@/src/features/chat/types";

const buildMessage = (
  role: ChatMessage["role"],
  content: string,
): ChatMessage => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role,
  content,
  createdAt: new Date().toISOString(),
});

export type StreamingStatus =
  | "planning"
  | "reading_pdf"
  | "searching_web"
  | "generating_answer"
  | null;

/** Maps backend SSE events to composer status; `undefined` means leave current status unchanged. */
const mapStreamingStatusFromEvent = (
  event: SsePayload,
): StreamingStatus | undefined => {
  if (event.type === "content" || event.type === "done") {
    return "generating_answer";
  }
  if (event.type === "node") {
    if (event.node === "planner") {
      return "planning";
    }
    if (event.node === "tools") {
      return "searching_web";
    }
    return "generating_answer";
  }
  return undefined;
};

export const useChat = () => {
  const queryClient = useQueryClient();
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const apiClient = useMemo(
    () => createApiClient({ baseUrl: apiBaseUrl }),
    [apiBaseUrl],
  );
  const conversationsListKey = useMemo(
    () => queryKeys.conversations.list(apiBaseUrl),
    [apiBaseUrl],
  );

  const {
    data: conversations = [],
    isFetching: isRefreshingConversations,
    refetch: refetchConversations,
  } = useQuery(conversationsListQueryOptions(apiClient));

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingStatus, setStreamingStatus] = useState<StreamingStatus>(null);
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  /** When true, new messages still sync to the server but the thread is hidden from the recents list. */
  const [temporaryMode, setTemporaryMode] = useState(false);

  /** Pagination: whether the server still has messages older than the currently-loaded page. */
  const [hasMoreOlderMessages, setHasMoreOlderMessages] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);

  /**
   * Streaming buffer + rAF flush. Backend sends many small SSE chunks per second;
   * committing every chunk to React causes the FlatList to re-render at SSE-rate
   * (often >60Hz) which drops frames. We coalesce all chunks received in a frame
   * into a single setMessages call.
   */
  const streamBufferRef = useRef("");
  const streamFlushRafRef = useRef<number | null>(null);
  const streamTargetIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (streamFlushRafRef.current != null) {
        cancelAnimationFrame(streamFlushRafRef.current);
        streamFlushRafRef.current = null;
      }
    };
  }, []);

  const hasMessages = messages.length > 0;

  const canSend = useMemo(() => {
    return input.trim().length > 0 && !isSending;
  }, [input, isSending]);

  const refreshConversationHistory = useCallback(async () => {
    await refetchConversations();
  }, [refetchConversations]);

  const upsertConversation = (
    conversationId: string,
    nextMessages: ChatMessage[],
  ) => {
    const firstUserMessage = nextMessages.find(
      (message) => message.role === "user",
    );
    const title = firstUserMessage
      ? firstUserMessage.content.slice(0, 40)
      : "New conversation";
    const updatedAt = new Date().toISOString();

    queryClient.setQueryData<ChatConversation[]>(
      conversationsListKey,
      (current = []) => {
        const existing = current.find(
          (conversation) => conversation.id === conversationId,
        );
        const updatedConversation: ChatConversation = {
          id: conversationId,
          title,
          updatedAt,
          messages: nextMessages,
        };

        if (!existing) {
          return [updatedConversation, ...current];
        }

        const others = current.filter(
          (conversation) => conversation.id !== conversationId,
        );
        return [updatedConversation, ...others];
      },
    );
  };

  const ensureConversation = async (
    hideFromRecents: boolean,
  ): Promise<string> => {
    let conversationId = activeConversationId;
    if (!conversationId) {
      const created = await createConversation(apiClient);
      conversationId = created.id;
      setActiveConversationId(conversationId);
      if (!hideFromRecents) {
        queryClient.setQueryData<ChatConversation[]>(
          conversationsListKey,
          (current = []) => {
            const next: ChatConversation = {
              id: created.id,
              title: created.title,
              updatedAt: created.updatedAt,
            };
            if (current.some((c) => c.id === created.id)) {
              return [next, ...current.filter((c) => c.id !== created.id)];
            }
            return [next, ...current];
          },
        );
      }
    }
    return conversationId;
  };

  const sendMessage = async (message?: string) => {
    const content = (message ?? input).trim();
    if (!content || isSending) {
      return;
    }

    const hideFromRecents = temporaryMode;

    setError(null);
    setStreamingStatus("generating_answer");
    setIsSending(true);

    let conversationId = activeConversationId;

    try {
      if (!conversationId) {
        conversationId = await ensureConversation(hideFromRecents);
      }

      const withUserMessage: ChatMessage[] = [
        ...messages,
        buildMessage("user", content),
      ];
      setMessages(withUserMessage);
      setLastUserMessage(content);
      if (!hideFromRecents) {
        upsertConversation(conversationId, withUserMessage);
      }

      const assistantMessage = buildMessage("assistant", "");
      const assistantMessageId = assistantMessage.id;
      const withAssistantMessage = [...withUserMessage, assistantMessage];
      setMessages(withAssistantMessage);

      let streamedReply = "";
      streamBufferRef.current = "";
      streamTargetIdRef.current = assistantMessageId;

      const flushStreamBuffer = () => {
        streamFlushRafRef.current = null;
        if (streamBufferRef.current === "") {
          return;
        }
        const targetId = streamTargetIdRef.current;
        if (!targetId) {
          streamBufferRef.current = "";
          return;
        }
        const next = streamBufferRef.current;
        setMessages((current) =>
          current.map((message) =>
            message.id === targetId ? { ...message, content: next } : message,
          ),
        );
      };

      const response = await sendConversationMessage(
        apiClient,
        conversationId,
        content,
        {
          onDelta: (delta) => {
            streamedReply += delta;
            streamBufferRef.current = streamedReply;
            if (streamFlushRafRef.current == null) {
              streamFlushRafRef.current =
                requestAnimationFrame(flushStreamBuffer);
            }
          },
          onEvent: (event) => {
            const next = mapStreamingStatusFromEvent(event);
            if (next !== undefined) {
              setStreamingStatus(next);
            }
          },
        },
      );

      if (streamFlushRafRef.current != null) {
        cancelAnimationFrame(streamFlushRafRef.current);
        streamFlushRafRef.current = null;
      }
      streamBufferRef.current = "";
      streamTargetIdRef.current = null;

      const finalReply =
        response.reply.trim().length > 0 ? response.reply : streamedReply;
      const finalizedMessages = withAssistantMessage.map((message) =>
        message.id === assistantMessageId
          ? { ...message, content: finalReply }
          : message,
      );
      setMessages(finalizedMessages);
      if (!hideFromRecents) {
        upsertConversation(conversationId, finalizedMessages);
        try {
          await queryClient.refetchQueries({ queryKey: conversationsListKey });
        } catch {
          // keep upserted sidebar row if list refresh fails
        }
      }
      setInput("");
    } catch (sendError) {
      if (streamFlushRafRef.current != null) {
        cancelAnimationFrame(streamFlushRafRef.current);
        streamFlushRafRef.current = null;
      }
      streamBufferRef.current = "";
      streamTargetIdRef.current = null;
      setMessages((current) =>
        current.filter(
          (message) => !(message.role === "assistant" && !message.content),
        ),
      );
      const msg =
        sendError instanceof Error
          ? sendError.message
          : "Không thể gửi tin nhắn.";
      setError(msg);
      throw sendError instanceof Error ? sendError : new Error(msg);
    } finally {
      setStreamingStatus(null);
      setIsSending(false);
    }
  };

  const uploadPdf = async (
    file: {
      uri: string;
      name: string;
      mimeType?: string;
    },
    message?: string,
  ) => {
    if (isSending) {
      return;
    }
    const hideFromRecents = temporaryMode;
    setError(null);
    setStreamingStatus("reading_pdf");
    setIsSending(true);

    const userText = (message ?? "").trim();
    const optimisticId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      role: "user",
      content: userText || file.name,
      createdAt: new Date().toISOString(),
      metadata: {
        type: "pdf",
        filename: file.name,
        message: userText || null,
      },
    };

    const optimisticList: ChatMessage[] = [...messages, optimisticMessage];
    setMessages(optimisticList);
    setLastUserMessage(null);
    setInput("");

    try {
      const conversationId = await ensureConversation(hideFromRecents);
      if (!hideFromRecents) {
        upsertConversation(conversationId, optimisticList);
      }

      await uploadConversationPdf(apiClient, conversationId, file, message);
      const page = await getConversationMessages(apiClient, conversationId);
      setMessages(page.messages);
      setHasMoreOlderMessages(page.hasMore);
      if (!hideFromRecents) {
        upsertConversation(conversationId, page.messages);
        try {
          await queryClient.refetchQueries({ queryKey: conversationsListKey });
        } catch {
          // keep upserted sidebar row if list refresh fails
        }
      }
    } catch (uploadError) {
      setMessages((current) => current.filter((m) => m.id !== optimisticId));
      const msg =
        uploadError instanceof Error
          ? uploadError.message
          : "Không thể tải PDF.";
      setError(msg);
      throw uploadError instanceof Error ? uploadError : new Error(msg);
    } finally {
      setStreamingStatus(null);
      setIsSending(false);
    }
  };

  const retryLastMessage = async () => {
    if (
      !lastUserMessage ||
      isSending ||
      messages.length === 0 ||
      !activeConversationId
    ) {
      return;
    }
    const last = messages[messages.length - 1];
    if (last.role !== "user" || last.content !== lastUserMessage) {
      return;
    }

    const hideFromRecents = temporaryMode;

    setError(null);
    setStreamingStatus("generating_answer");
    setIsSending(true);
    try {
      const remotePage = await getConversationMessages(
        apiClient,
        activeConversationId,
      );
      const remote = remotePage.messages;
      const lastRemote = remote[remote.length - 1];

      if (lastRemote?.role === "assistant") {
        setMessages(remote);
        setHasMoreOlderMessages(remotePage.hasMore);
        if (!hideFromRecents) {
          upsertConversation(activeConversationId, remote);
          try {
            await queryClient.refetchQueries({
              queryKey: conversationsListKey,
            });
          } catch {
            // ignore
          }
        }
        return;
      }

      let response: ChatResponse;
      if (
        lastRemote?.role === "user" &&
        lastRemote.content === lastUserMessage
      ) {
        response = await completeAssistantReply(
          apiClient,
          activeConversationId,
        );
      } else {
        response = await sendConversationMessage(
          apiClient,
          activeConversationId,
          lastUserMessage,
          {
            onEvent: (event) => {
              const next = mapStreamingStatusFromEvent(event);
              if (next !== undefined) {
                setStreamingStatus(next);
              }
            },
          },
        );
      }

      const assistantMessage = buildMessage("assistant", response.reply);
      const withAssistantMessage = [...messages, assistantMessage];
      setMessages(withAssistantMessage);
      if (!hideFromRecents) {
        upsertConversation(activeConversationId, withAssistantMessage);
        try {
          await queryClient.refetchQueries({ queryKey: conversationsListKey });
        } catch {
          // ignore
        }
      }
    } catch (sendError) {
      const msg =
        sendError instanceof Error
          ? sendError.message
          : "Không thể gửi tin nhắn.";
      setError(msg);
      throw sendError instanceof Error ? sendError : new Error(msg);
    } finally {
      setStreamingStatus(null);
      setIsSending(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setError(null);
    setLastUserMessage(null);
    setActiveConversationId(null);
    setHasMoreOlderMessages(false);
    setIsLoadingOlderMessages(false);
  };

  const loadConversation = async (conversationId: string) => {
    if (isSending) {
      return;
    }
    setError(null);
    setTemporaryMode(false);
    setHasMoreOlderMessages(false);
    setIsLoadingOlderMessages(false);
    try {
      const page = await getConversationMessages(apiClient, conversationId);
      setMessages(page.messages);
      setHasMoreOlderMessages(page.hasMore);
      setActiveConversationId(conversationId);
      setLastUserMessage(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải cuộc trò chuyện.",
      );
    }
  };

  /**
   * Cursor pagination: fetch the page just older than the currently-loaded
   * oldest message and prepend. Safe to call repeatedly while scrolled near
   * the top — internal guards prevent overlapping requests and stop once the
   * server reports no more older pages.
   */
  const loadOlderMessages = useCallback(async () => {
    if (isLoadingOlderMessages) {
      return;
    }
    if (!hasMoreOlderMessages) {
      return;
    }
    if (isSending) {
      // Avoid interleaving prepend with the streaming reply tail.
      return;
    }
    const conversationId = activeConversationId;
    if (!conversationId) {
      return;
    }
    const oldest = messages[0];
    if (!oldest) {
      return;
    }

    setIsLoadingOlderMessages(true);
    try {
      const page = await getConversationMessages(apiClient, conversationId, {
        beforeId: oldest.id,
      });
      if (page.messages.length === 0) {
        setHasMoreOlderMessages(false);
        return;
      }
      setMessages((current) => {
        const existingIds = new Set(current.map((m) => m.id));
        const prepended = page.messages.filter((m) => !existingIds.has(m.id));
        return prepended.length === 0 ? current : [...prepended, ...current];
      });
      setHasMoreOlderMessages(page.hasMore);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải thêm tin nhắn cũ.",
      );
    } finally {
      setIsLoadingOlderMessages(false);
    }
  }, [
    apiClient,
    activeConversationId,
    hasMoreOlderMessages,
    isLoadingOlderMessages,
    isSending,
    messages,
  ]);

  const toggleTemporaryChatMode = () => {
    if (isSending) {
      return;
    }
    setTemporaryMode((v) => !v);
  };

  const discardActiveConversation = () => {
    if (isSending) {
      return;
    }
    const id = activeConversationId;
    if (id) {
      queryClient.setQueryData<ChatConversation[]>(
        conversationsListKey,
        (current = []) =>
          current.filter((conversation) => conversation.id !== id),
      );
    }
    setTemporaryMode(false);
    clearConversation();
  };

  const removeConversation = async (conversationId: string) => {
    if (isSending || isDeletingConversation) {
      return;
    }
    setError(null);
    setIsDeletingConversation(true);
    try {
      await deleteConversation(apiClient, conversationId);
      queryClient.setQueryData<ChatConversation[]>(
        conversationsListKey,
        (current = []) =>
          current.filter((conversation) => conversation.id !== conversationId),
      );
      if (activeConversationId === conversationId) {
        setTemporaryMode(false);
        clearConversation();
      }
    } catch (deleteError) {
      const msg =
        deleteError instanceof Error
          ? deleteError.message
          : "Không thể xóa cuộc trò chuyện.";
      setError(msg);
      throw deleteError instanceof Error ? deleteError : new Error(msg);
    } finally {
      setIsDeletingConversation(false);
    }
  };

  const deleteActiveConversation = async () => {
    if (!activeConversationId) {
      return;
    }
    await removeConversation(activeConversationId);
  };

  const startNewConversation = () => {
    if (isSending) {
      return;
    }
    setTemporaryMode(false);
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
    streamingStatus,
    sendMessage,
    uploadPdf,
    retryLastMessage,
    loadConversation,
    startNewConversation,
    clearConversation,
    refreshConversationHistory,
    removeConversation,
    deleteActiveConversation,
    temporaryMode,
    toggleTemporaryChatMode,
    discardActiveConversation,
    isRefreshingConversations,
    isDeletingConversation,
    hasMoreOlderMessages,
    isLoadingOlderMessages,
    loadOlderMessages,
  };
};
