import { Image, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/src/theme";

type HomeHeaderProps = {
  greeting: string;
  userName: string;
  avatarUri?: string | null;
  onProfilePress?: () => void;
  onPredictPress?: () => void;
};

const AVATAR_SIZE = 48;
const ICON_BUTTON_SIZE = 34;

export function HomeHeader({
  greeting,
  userName,
  avatarUri,
  onProfilePress,
  onPredictPress,
}: HomeHeaderProps) {
  const { colors: c, isDark } = useAppTheme();

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <Pressable
          onPress={onProfilePress}
          style={styles.profileBlock}
          disabled={!onProfilePress}
          accessibilityRole="button"
          accessibilityLabel={userName}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? "#3A4A5C" : "#B8D4E8" }]}>
              <Ionicons name="person" size={26} color={isDark ? "#CBD5E1" : "#FFFFFF"} />
            </View>
          )}
          <View style={styles.profileText}>
            <ThemedText style={[styles.greeting, { color: c.hint }]}>{greeting}</ThemedText>
            <ThemedText style={[styles.userName, { color: c.title }]} numberOfLines={1}>
              {userName}
            </ThemedText>
          </View>
        </Pressable>

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
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 0,
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
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
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
  iconButton: {
    width: ICON_BUTTON_SIZE,
    height: ICON_BUTTON_SIZE,
    borderRadius: ICON_BUTTON_SIZE / 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
