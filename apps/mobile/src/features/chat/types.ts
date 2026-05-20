export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

export type ChatApiMessage = {
  role: ChatRole;
  content: string;
};

export type ChatResponse = {
  reply: string;
};

export type ChatConversation = {
  id: string;
  title: string;
  updatedAt: string;
  messages?: ChatMessage[];
};
