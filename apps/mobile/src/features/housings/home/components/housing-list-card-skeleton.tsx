import { StyleSheet, View } from "react-native";

import { SkeletonBox } from "@/src/components/skeleton-box";

import { HOUSING_LIST_CARD_CAROUSEL_WIDTH } from "./housing-list-card";

type Props = {
  layout?: "full" | "carousel";
};

export function HousingListCardSkeleton({ layout = "full" }: Props) {
  const isCarousel = layout === "carousel";

  return (
    <View style={[styles.card, isCarousel && styles.cardCarousel]}>
      <SkeletonBox
        style={[styles.media, isCarousel && styles.mediaCarousel]}
        borderRadius={22}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    overflow: "hidden",
  },
  cardCarousel: {
    width: HOUSING_LIST_CARD_CAROUSEL_WIDTH,
  },
  media: {
    width: "100%",
    aspectRatio: 4 / 3,
  },
  mediaCarousel: {
    width: HOUSING_LIST_CARD_CAROUSEL_WIDTH,
  },
});
