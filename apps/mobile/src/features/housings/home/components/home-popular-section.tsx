import { useCallback } from "react";
import type { ComponentProps } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { HousingListCard } from "@/src/features/housings/home/components/housing-list-card";
import { HousingPopularCard } from "@/src/features/housings/home/components/housing-popular-card";
import type { Housing } from "@/src/features/housings/types";
import type { Dictionary } from "@/src/i18n";
import { useAppTheme } from "@/src/theme";

type HomeCopy = Dictionary["home"];

type CardVariant = "popular" | "listing";
type TitleIconName = ComponentProps<typeof Ionicons>["name"];

type Props = {
  title: string;
  housings: Housing[];
  copy: HomeCopy;
  contactForPrice: string;
  listKeyPrefix?: string;
  cardVariant?: CardVariant;
  viewAllLabel?: string;
  onViewAllPress?: () => void;
  titleIcon?: TitleIconName;
  titleIconColor?: string;
  saveAccessibilityLabel?: string;
  showSaveOnPopularCard?: boolean;
  showSaveOnListCard?: boolean;
};

export function HomePopularSection({
  title,
  housings,
  copy,
  contactForPrice,
  listKeyPrefix = "popular",
  cardVariant = "popular",
  viewAllLabel,
  onViewAllPress,
  titleIcon,
  titleIconColor,
  saveAccessibilityLabel,
  showSaveOnPopularCard = false,
  showSaveOnListCard = false,
}: Props) {
  const { colors: c } = useAppTheme();
  const showViewAll = Boolean(viewAllLabel && onViewAllPress);

  const renderItem = useCallback(
    ({ item }: { item: Housing }) =>
      cardVariant === "listing" ? (
        <HousingListCard
          housing={item}
          copy={copy}
          contactForPrice={contactForPrice}
          layout="carousel"
          showSaveButton={showSaveOnListCard && Boolean(saveAccessibilityLabel)}
          saveAccessibilityLabel={saveAccessibilityLabel}
        />
      ) : (
        <HousingPopularCard
          housing={item}
          copy={copy}
          contactForPrice={contactForPrice}
          showSaveButton={showSaveOnPopularCard && Boolean(saveAccessibilityLabel)}
          saveAccessibilityLabel={saveAccessibilityLabel}
        />
      ),
    [
      cardVariant,
      contactForPrice,
      copy,
      saveAccessibilityLabel,
      showSaveOnListCard,
      showSaveOnPopularCard,
    ],
  );

  const keyExtractor = useCallback(
    (item: Housing) => `${listKeyPrefix}-${item.id}`,
    [listKeyPrefix],
  );

  if (housings.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          {titleIcon ? (
            <Ionicons
              name={titleIcon}
              size={20}
              color={titleIconColor ?? c.primary}
            />
          ) : null}
          <ThemedText style={[styles.title, { color: c.title }]} numberOfLines={1}>
            {title}
          </ThemedText>
        </View>
        {showViewAll ? (
          <Pressable
            onPress={onViewAllPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={viewAllLabel}
          >
            <ThemedText style={[styles.viewAll, { color: c.primary }]}>{viewAllLabel}</ThemedText>
          </Pressable>
        ) : null}
      </View>
      <FlatList
        data={housings}
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  titleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: "700",
    fontStyle: "italic",
    textDecorationLine: "underline",
  },
  listContent: {
    paddingHorizontal: 16,
  },
  separator: {
    width: 12,
  },
});
