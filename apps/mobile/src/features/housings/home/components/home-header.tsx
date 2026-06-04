import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { href } from "@/src/navigation/href";
import { useAppTheme } from "@/src/theme";

type HomeHeaderProps = {
  title: string;
  searchPlaceholder: string;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  searchOpen: boolean;
  onSearchToggle: () => void;
  hasActiveFilters?: boolean;
  onFilterPress?: () => void;
  filterAccessibilityLabel?: string;
};

const SEARCH_ROW_HEIGHT = 44;

export function HomeHeader({
  title,
  searchPlaceholder,
  searchQuery,
  onSearchQueryChange,
  searchOpen,
  onSearchToggle,
  hasActiveFilters = false,
  onFilterPress,
  filterAccessibilityLabel,
}: HomeHeaderProps) {
  const { colors: c } = useAppTheme();
  const searchAnim = useRef(new Animated.Value(searchOpen ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(searchAnim, {
      toValue: searchOpen ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [searchAnim, searchOpen]);

  const searchRowHeight = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SEARCH_ROW_HEIGHT],
  });
  const searchOpacity = searchAnim.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0, 1],
  });
  const searchTranslateY = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-6, 0],
  });

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <ThemedText style={[styles.title, { color: c.title }]}>{title}</ThemedText>
        <View style={styles.actions}>
          <Pressable
            onPress={onSearchToggle}
            style={[
              styles.iconButton,
              {
                borderColor: c.border,
                backgroundColor: searchOpen ? c.chipBg : c.card,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ expanded: searchOpen }}>
            <Ionicons
              name={searchOpen ? "close" : "search-outline"}
              size={18}
              color={searchOpen ? c.primary : c.title}
            />
          </Pressable>
          <Pressable
            onPress={() => router.push(href.mainHousingPredict)}
            style={[styles.iconButton, { borderColor: c.border, backgroundColor: c.card }]}
            accessibilityRole="button">
            <Ionicons name="sparkles-outline" size={18} color={c.primary} />
          </Pressable>
        </View>
      </View>

      <Animated.View
        style={[
          styles.searchWrap,
          {
            height: searchRowHeight,
            opacity: searchOpacity,
            transform: [{ translateY: searchTranslateY }],
          },
        ]}>
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchField,
              { borderColor: c.border, backgroundColor: c.card },
            ]}>
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
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 6,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 26, fontWeight: "700", flex: 1 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    overflow: "hidden",
    marginTop: 10,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchField: {
    flex: 1,
    height: SEARCH_ROW_HEIGHT,
    borderRadius: 12,
    borderWidth: 1,
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
