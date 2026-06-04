import { Image, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/src/theme";

type HomeHeaderProps = {
  greeting: string;
  userName: string;
  avatarUri?: string | null;
  searchPlaceholder: string;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onProfilePress?: () => void;
  onPredictPress?: () => void;
  hasActiveFilters?: boolean;
  onFilterPress?: () => void;
  filterAccessibilityLabel?: string;
};

const SEARCH_ROW_HEIGHT = 44;
const AVATAR_SIZE = 48;
const ICON_BUTTON_SIZE = 34;

export function HomeHeader({
  greeting,
  userName,
  avatarUri,
  searchPlaceholder,
  searchQuery,
  onSearchQueryChange,
  onProfilePress,
  onPredictPress,
  hasActiveFilters = false,
  onFilterPress,
  filterAccessibilityLabel,
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

      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchField,
            { borderColor: c.border, backgroundColor: isDark ? c.card : "#FFFFFF" },
          ]}
        >
          <Ionicons name="search" size={16} color={c.hint} />
          <TextInput
            value={searchQuery}
            onChangeText={onSearchQueryChange}
            placeholder={searchPlaceholder}
            placeholderTextColor={c.hint}
            style={[styles.searchInput, { color: c.title }]}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>
        {onFilterPress ? (
          <Pressable
            onPress={onFilterPress}
            accessibilityRole="button"
            accessibilityLabel={filterAccessibilityLabel}
            style={[
              styles.iconButton,
              styles.filterButtonOuter,
              {
                borderColor: c.border,
                backgroundColor: hasActiveFilters ? c.chipBg : c.card,
              },
            ]}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={hasActiveFilters ? c.primary : c.title}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 4,
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
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  searchField: {
    flex: 1,
    height: SEARCH_ROW_HEIGHT,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  filterButtonOuter: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
});
