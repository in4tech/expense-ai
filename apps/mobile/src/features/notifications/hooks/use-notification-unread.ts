import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";

import {
  ensureNotificationReadSeeded,
  getNotificationReadIds,
  hasUnreadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeNotificationReadState,
} from "@/src/features/notifications/notification-read-state";

type MockNotificationMeta = readonly { id: string; read: boolean }[];

export function useNotificationReadState(mockItems: MockNotificationMeta) {
  const readIds = useSyncExternalStore(
    subscribeNotificationReadState,
    getNotificationReadIds,
    getNotificationReadIds,
  );

  const allIds = useMemo(() => mockItems.map((item) => item.id), [mockItems]);

  useEffect(() => {
    ensureNotificationReadSeeded(mockItems.filter((item) => item.read).map((item) => item.id));
  }, [mockItems]);

  const hasUnread = hasUnreadNotifications(allIds);

  const markRead = useCallback((id: string) => {
    markNotificationRead(id);
  }, []);

  const markAllRead = useCallback(() => {
    markAllNotificationsRead(allIds);
  }, [allIds]);

  return {
    readIds,
    hasUnread,
    markRead,
    markAllRead,
  };
}
