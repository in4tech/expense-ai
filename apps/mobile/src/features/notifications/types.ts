export type NotificationKind = "listing" | "price_drop" | "system" | "reminder";

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  timeLabel: string;
  read: boolean;
};
