import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import type { NotificationKind } from "@/src/features/notifications/types";
import { useAppTheme } from "@/src/theme";

type NotificationListItemProps = {
  kind: NotificationKind;
  title: string;
  body: string;
  timeLabel: string;
  read: boolean;
  onPress?: () => void;
};

const KIND_ICON: Record<
  NotificationKind,
  {
    name: "home-outline" | "trending-down-outline" | "information-circle-outline" | "calendar-outline";
    colorKey: "primary" | "link" | "success" | "danger";
  }
> = {
  listing: { name: "home-outline", colorKey: "primary" },
  price_drop: { name: "trending-down-outline", colorKey: "success" },
  system: { name: "information-circle-outline", colorKey: "link" },
  reminder: { name: "calendar-outline", colorKey: "primary" },
};

export function NotificationListItem({
  kind,
  title,
  body,
  timeLabel,
  read,
  onPress,
}: NotificationListItemProps) {
  const { colors: c } = useAppTheme();
  const icon = KIND_ICON[kind];
  const iconColor = c[icon.colorKey];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.root,
        {
          backgroundColor: read ? c.card : c.chipBg,
          borderColor: c.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: c.card }]}>
        <Ionicons name={icon.name} size={17} color={iconColor} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.titleGroup}>
            <ThemedText
              style={[styles.title, { color: c.title, fontWeight: read ? "600" : "800" }]}
              numberOfLines={1}
            >
              {title}
            </ThemedText>
            {!read ? <View style={[styles.unreadDot, { backgroundColor: c.primary }]} /> : null}
          </View>
          <ThemedText style={[styles.time, { color: c.hint }]} numberOfLines={1}>
            {timeLabel}
          </ThemedText>
        </View>
        <ThemedText style={[styles.body, { color: c.text }]} numberOfLines={2}>
          {body}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  titleGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
  },
  title: {
    flex: 1,
    fontSize: 14,
    letterSpacing: -0.2,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  body: {
    fontSize: 12,
    lineHeight: 16,
  },
  time: {
    fontSize: 11,
    fontWeight: "500",
    flexShrink: 0,
    marginTop: 1,
  },
});
