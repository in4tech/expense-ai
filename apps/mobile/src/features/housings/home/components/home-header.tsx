import { Image, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/src/theme";

type HomeHeaderProps = {
  greeting: string;
  userName: string;
  avatarUri?: string | null;
  onNotificationPress?: () => void;
  notificationAccessibilityLabel?: string;
  showNotificationBadge?: boolean;
  onPredictPress?: () => void;
};

const AVATAR_SIZE = 48;
const ICON_BUTTON_SIZE = 34;

export function HomeHeader({
  greeting,
  userName,
  avatarUri,
  onNotificationPress,
  notificationAccessibilityLabel,
  showNotificationBadge = false,
  onPredictPress,
}: HomeHeaderProps) {
  const { colors: c, isDark } = useAppTheme();

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <View style={styles.profileBlock} accessibilityLabel={userName}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarPlaceholder,
                { backgroundColor: isDark ? "#3A4A5C" : "#B8D4E8" },
              ]}
            >
              <Ionicons name="person" size={26} color={isDark ? "#CBD5E1" : "#FFFFFF"} />
            </View>
          )}
          <View style={styles.profileText}>
            <ThemedText style={[styles.greeting, { color: c.hint }]}>{greeting}</ThemedText>
            <ThemedText style={[styles.userName, { color: c.title }]} numberOfLines={1}>
              {userName}
            </ThemedText>
          </View>
        </View>

        {onNotificationPress || onPredictPress ? (
          <View style={styles.actions}>
            {onNotificationPress ? (
              <View style={styles.iconButtonWrap}>
                <Pressable
                  onPress={onNotificationPress}
                  style={[styles.iconButton, { borderColor: c.border, backgroundColor: c.card }]}
                  accessibilityRole="button"
                  accessibilityLabel={notificationAccessibilityLabel}
                >
                  <Ionicons name="notifications-outline" size={18} color={c.link} />
                </Pressable>
                {showNotificationBadge ? (
                  <View
                    style={[styles.notificationBadge, { backgroundColor: c.danger, borderColor: c.card }]}
                  />
                ) : null}
              </View>
            ) : null}
            {onPredictPress ? (
              <Pressable
                onPress={onPredictPress}
                style={[styles.iconButton, { borderColor: c.border, backgroundColor: c.card }]}
                accessibilityRole="button"
              >
                <Ionicons name="sparkles-outline" size={18} color={c.primary} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  profileBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  profileText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  greeting: {
    fontSize: 13,
    fontWeight: "500",
  },
  userName: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButtonWrap: {
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  iconButton: {
    width: ICON_BUTTON_SIZE,
    height: ICON_BUTTON_SIZE,
    borderRadius: ICON_BUTTON_SIZE / 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
