import { StyleSheet, View } from "react-native";

import { SkeletonBox } from "@/src/components/skeleton-box";

const CARD_WIDTH = 268;

type Props = {
  layout?: "carousel" | "full";
};

export function HousingPopularCardSkeleton({ layout = "carousel" }: Props) {
  const isFullWidth = layout === "full";

  return (
    <View style={[styles.card, isFullWidth && styles.cardFull]}>
      <SkeletonBox
        style={[styles.media, isFullWidth && styles.mediaFull]}
        borderRadius={18}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 18,
    overflow: "hidden",
  },
  cardFull: {
    width: "100%",
  },
  media: {
    width: CARD_WIDTH,
    aspectRatio: 4 / 3,
  },
  mediaFull: {
    width: "100%",
  },
});
