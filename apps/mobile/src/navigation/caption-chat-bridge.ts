let pendingDraft: string | null = null;

export function setCaptionChatDraft(message: string): void {
  pendingDraft = message;
}

export function consumeCaptionChatDraft(): string | null {
  const draft = pendingDraft;
  pendingDraft = null;
  return draft;
}
