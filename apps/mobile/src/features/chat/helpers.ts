import { ChatMessage } from '@/src/features/chat/types';

export type ChatListItem =
  | { type: 'day'; id: string; label: string }
  | { type: 'message'; message: ChatMessage };

function localDayStartMs(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function formatDaySeparatorLabel(
  iso: string,
  language: 'en' | 'vn',
  labels: { today: string; yesterday: string }
): string {
  const date = new Date(iso);
  const dayStart = localDayStartMs(date);
  const now = new Date();
  const todayStart = localDayStartMs(now);
  const yesterdayRef = new Date(now);
  yesterdayRef.setDate(yesterdayRef.getDate() - 1);
  const yesterdayStart = localDayStartMs(yesterdayRef);

  const locale = language === 'vn' ? 'vi-VN' : 'en-US';
  const timeStr = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  let dayPart: string;
  if (dayStart === todayStart) {
    dayPart = labels.today;
  } else if (dayStart === yesterdayStart) {
    dayPart = labels.yesterday;
  } else {
    dayPart = date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return `${dayPart} · ${timeStr}`;
}

export function buildChatListWithDaySeparators(
  rows: ChatMessage[],
  language: 'en' | 'vn',
  labels: { today: string; yesterday: string }
): ChatListItem[] {
  const items: ChatListItem[] = [];
  let prevDayStart: number | null = null;

  for (const message of rows) {
    const dayStart = localDayStartMs(new Date(message.createdAt));
    if (prevDayStart === null || dayStart !== prevDayStart) {
      items.push({
        type: 'day',
        id: `day-${dayStart}-${message.id}`,
        label: formatDaySeparatorLabel(message.createdAt, language, labels),
      });
      prevDayStart = dayStart;
    }
    items.push({ type: 'message', message });
  }

  return items;
}
