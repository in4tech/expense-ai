import { apiPaths, type ApiClient } from "@/src/api";
import { resolveApiRequestLogging } from "@/src/api/request-log";
import type { ChatResponse } from "@/src/features/chat/types";
import EventSource from "react-native-sse";

/** SSE `data:` JSON from POST `/conversations/{id}/chat-stream` (matches backend `sse_event` payloads). */
export type SseThinkingEvent = { type: "thinking"; iteration: number };
export type SseToolRunningEvent = { type: "tool_running"; tool: string };
export type SseToolCompletedEvent = { type: "tool_completed"; tool: string };
export type SseContentEvent = { type: "content"; content: string };
export type SseReflectionEvent = {
  type: "reflection";
  status: "running" | "completed";
};
export type SseDoneEvent = {
  type: "done";
  content?: string;
  answer?: string;
};
export type SseErrorEvent = { type: "error"; message?: string };

export type SsePayload =
  | SseThinkingEvent
  | SseToolRunningEvent
  | SseToolCompletedEvent
  | SseContentEvent
  | SseReflectionEvent
  | SseDoneEvent
  | SseErrorEvent
  /** Future / unknown server events: still delivered to `onEvent`. */
  | (Record<string, unknown> & { type: string });

const parseSsePayload = (rawData: string): SsePayload | null => {
  try {
    const value = JSON.parse(rawData) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }
    const rec = value as Record<string, unknown>;
    if (typeof rec.type !== "string") {
      return null;
    }
    return value as SsePayload;
  } catch {
    return null;
  }
};

export type SendConversationMessageOptions = {
  /** Called for each content chunk from SSE stream. */
  onDelta?: (delta: string) => void;
  /** Called for every parsed SSE payload event. */
  onEvent?: (event: SsePayload) => void;
  getAccessToken?: () => string | undefined;
};

/**
 * POST `/conversations/{conversationId}/chat-stream` — response is `text/event-stream` (SSE).
 * Each `data:` line is JSON: `thinking`, `tool_running`, `tool_completed`, `content`, `reflection`, `done`, `error`.
 */
export const sendConversationMessage = async (
  client: ApiClient,
  conversationId: string,
  message: string,
  options?: SendConversationMessageOptions,
): Promise<ChatResponse> => {
  if (!conversationId.trim()) {
    throw new Error("Invalid conversation id.");
  }
  const onDelta = options?.onDelta ?? (() => {});
  const onEvent = options?.onEvent ?? (() => {});
  const logApi = resolveApiRequestLogging(undefined);

  const reply = await new Promise<string>((resolve, reject) => {
    const streamUrl = client.buildUrl(
      apiPaths.conversations.chatStream(conversationId),
    );
    let full = "";
    let settled = false;

    const streamBody = JSON.stringify({ message });
    const streamHeaders: Record<string, string> = {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
    };
    const accessToken = options?.getAccessToken?.();
    if (accessToken) {
      streamHeaders.Authorization = `Bearer ${accessToken}`;
    }
    if (logApi) {
      console.log(`[API] → SSE POST ${streamUrl}`);
      console.log("[API]   headers", streamHeaders);
      console.log("[API]   body", streamBody);
    }

    const es = new EventSource(streamUrl, {
      method: "POST",
      headers: streamHeaders,
      body: streamBody,
      pollingInterval: 0,
    });

    const finalize = (error?: Error) => {
      if (settled) {
        return;
      }
      settled = true;
      es.removeAllEventListeners();
      es.close();
      if (logApi) {
        if (error) {
          console.log(`[API] ← SSE POST ${streamUrl} error`, error.message);
        } else {
          console.log(
            `[API] ← SSE POST ${streamUrl} done (${full.length} chars)`,
          );
        }
      }
      if (error) {
        reject(error);
        return;
      }
      resolve(full);
    };

    es.addEventListener("message", (event) => {
      if (!event.data) {
        return;
      }
      const payload = parseSsePayload(event.data);
      if (!payload) {
        full += event.data;
        onDelta(event.data);
        return;
      }
      onEvent(payload);

      if (payload.type === "content" && typeof payload.content === "string") {
        full += payload.content;
        onDelta(payload.content);
        return;
      }

      if (payload.type === "done") {
        const doneText =
          typeof payload.content === "string"
            ? payload.content
            : typeof payload.answer === "string"
              ? payload.answer
              : "";
        if (doneText.length > full.length) {
          onDelta(doneText.slice(full.length));
        }
        if (doneText.length > 0) {
          full = doneText;
        }
        finalize();
        return;
      }

      if (payload.type === "error") {
        const errMsg =
          typeof payload.message === "string"
            ? payload.message
            : "SSE stream error.";
        finalize(new Error(errMsg));
      }
    });

    es.addEventListener("error", (event) => {
      const reason =
        "message" in event && event.message
          ? event.message
          : "SSE connection failed.";
      finalize(new Error(reason));
    });
  });

  return { reply };
};

export const completeAssistantReply = async (
  client: ApiClient,
  conversationId: string,
): Promise<ChatResponse> => {
  const payload = await client.post<unknown>(
    apiPaths.conversations.assistant(conversationId),
    {},
    "Retry failed",
  );
  if (
    !payload ||
    typeof payload !== "object" ||
    typeof (payload as ChatResponse).reply !== "string"
  ) {
    throw new Error("Invalid chat response from server.");
  }
  return payload as ChatResponse;
};
