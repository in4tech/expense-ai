import { ScrollView, StyleSheet, View } from "react-native";

import { HousingListCardSkeleton } from "./housing-list-card-skeleton";
import { HousingPopularCardSkeleton } from "./housing-popular-card-skeleton";

type Props = {
  variant?: "list" | "popular";
  itemCount?: number;
};

const DEFAULT_ITEM_COUNT = 5;

export function HomeListingsLoadingSkeleton({
  variant = "list",
  itemCount = DEFAULT_ITEM_COUNT,
}: Props) {
  const items = Array.from({ length: itemCount }, (_, index) => index);

  return (
    <ScrollView
      style={styles.list}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    >
      {items.map((index) => (
        <View key={index} style={styles.listItem}>
          {variant === "popular" ? (
            <HousingPopularCardSkeleton layout="full" />
          ) : (
            <HousingListCardSkeleton layout="full" />
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listItem: {
    paddingHorizontal: 16,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 32,
    gap: 16,
  },
});
