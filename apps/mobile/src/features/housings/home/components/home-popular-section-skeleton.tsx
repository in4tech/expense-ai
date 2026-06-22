import { ScrollView, StyleSheet, View } from "react-native";

import { SkeletonBox } from "@/src/components/skeleton-box";

import { HousingListCardSkeleton } from "./housing-list-card-skeleton";
import { HousingPopularCardSkeleton } from "./housing-popular-card-skeleton";

type CardVariant = "popular" | "listing";

type Props = {
  cardVariant?: CardVariant;
  cardCount?: number;
};

const DEFAULT_CARD_COUNT = 3;

export function HomePopularSectionSkeleton({
  cardVariant = "popular",
  cardCount = DEFAULT_CARD_COUNT,
}: Props) {
  const cards = Array.from({ length: cardCount }, (_, index) => index);

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <SkeletonBox style={styles.titleIcon} borderRadius={10} />
        <SkeletonBox style={styles.title} borderRadius={8} />
      </View>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {cards.map((index) => (
          <View key={index} style={index > 0 ? styles.cardGap : undefined}>
            {cardVariant === "listing" ? (
              <HousingListCardSkeleton layout="carousel" />
            ) : (
              <HousingPopularCardSkeleton />
            )}
          </View>
        ))}
      </ScrollView>
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
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  titleIcon: {
    width: 20,
    height: 20,
  },
  title: {
    flex: 1,
    maxWidth: 200,
    height: 22,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  cardGap: {
    marginLeft: 12,
  },
});
