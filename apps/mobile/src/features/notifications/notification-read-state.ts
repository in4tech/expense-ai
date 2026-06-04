const listeners = new Set<() => void>();

let readIds = new Set<string>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeNotificationReadState(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getNotificationReadIds(): ReadonlySet<string> {
  return readIds;
}

/** Seeds read state from mock defaults once; preserves user marks afterward. */
export function ensureNotificationReadSeeded(initiallyRead: Iterable<string>) {
  if (readIds.size > 0) {
    return;
  }
  readIds = new Set(initiallyRead);
  emit();
}

export function hasUnreadNotifications(allIds: readonly string[]): boolean {
  return allIds.some((id) => !readIds.has(id));
}

export function markNotificationRead(id: string) {
  if (readIds.has(id)) {
    return;
  }
  readIds = new Set(readIds);
  readIds.add(id);
  emit();
}

export function markAllNotificationsRead(ids: readonly string[]) {
  const next = new Set(readIds);
  let changed = false;
  for (const id of ids) {
    if (!next.has(id)) {
      next.add(id);
      changed = true;
    }
  }
  if (!changed) {
    return;
  }
  readIds = next;
  emit();
}
