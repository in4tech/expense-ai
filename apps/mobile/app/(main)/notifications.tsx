import { useCallback, useMemo } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import {
  NotificationListItem,
  NotificationsEmpty,
  useNotificationReadState,
  type NotificationItem,
} from "@/src/features/notifications";
import { useLanguage } from "@/src/i18n";
import { StackIconButton } from "@/src/components/stack-icon-button";
import { useAppTheme } from "@/src/theme";

export default function NotificationsScreen() {
  const { dictionary } = useLanguage();
  const { colors: c } = useAppTheme();
  const copy = dictionary.notifications;

  const mockItems = copy.mockItems;
  const { hasUnread, readIds, markAllRead, markRead } = useNotificationReadState(mockItems);

  const items = useMemo<NotificationItem[]>(
    () =>
      mockItems.map((item) => ({
        ...item,
        read: readIds.has(item.id),
      })),
    [mockItems, readIds],
  );

  const renderItem = useCallback(
    ({ item }: { item: NotificationItem }) => (
      <View style={styles.listItem}>
        <NotificationListItem
          kind={item.kind}
          title={item.title}
          body={item.body}
          timeLabel={item.timeLabel}
          read={item.read}
          onPress={() => markRead(item.id)}
        />
      </View>
    ),
    [markRead],
  );

  const keyExtractor = useCallback((item: NotificationItem) => item.id, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.screen }]} edges={["top"]}>
      <View style={styles.header}>
        <StackIconButton
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={copy.backA11y}
        >
          <Ionicons name="chevron-back" size={18} color={c.title} />
        </StackIconButton>
        <ThemedText style={[styles.headerTitle, { color: c.title }]} numberOfLines={1}>
          {copy.title}
        </ThemedText>
        {hasUnread ? (
          <Pressable
            onPress={markAllRead}
            accessibilityRole="button"
            hitSlop={8}
            style={styles.markAllButton}
          >
            <ThemedText style={[styles.markAllText, { color: c.primary }]} numberOfLines={1}>
              {copy.markAllRead}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          items.length === 0 ? styles.listContentEmpty : null,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<NotificationsEmpty message={copy.empty} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  markAllButton: {
    maxWidth: 120,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: "700",
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 32,
    gap: 8,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  listItem: {
    paddingHorizontal: 16,
  },
});
