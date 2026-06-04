import { useCallback, useEffect, useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import {
  HousingFastImage,
  preloadHousingImages,
} from "@/src/features/housings/house-detail/upload-images/components/housing-fast-image";
import { formatListingPrice } from "@/src/features/housings/house-detail/utils";
import type { Housing } from "@/src/features/housings/types";
import type { Dictionary } from "@/src/i18n";
import { isMockRecommendationHousing } from "@/src/features/housings/home/data/mock-recommendation-housings";
import { href } from "@/src/navigation/href";
import { useAppTheme } from "@/src/theme";

type HomeCopy = Dictionary["home"];

type Props = {
  housing: Housing;
  copy: HomeCopy;
  contactForPrice: string;
};

export function HousingPopularCard({ housing, copy, contactForPrice }: Props) {
  const { colors: c, isDark } = useAppTheme();
  const coverUri = housing.image_urls[0];

  const infoColors = useMemo(
    () => ({
      barBg: isDark ? "rgba(38, 42, 48, 0.96)" : "rgba(71, 85, 105, 0.94)",
      title: "#FFFFFF",
      price: "#E2E8F0",
    }),
    [isDark],
  );

  const displayName = housing.house_name ?? copy.untitledHousing;
  const displayPrice = formatListingPrice(housing.price, contactForPrice);
  const roomLine = housing.room_code
    ? `${copy.roomCodeLabel} ${housing.room_code}`
    : copy.roomCodeLabel;

  useEffect(() => {
    preloadHousingImages(housing.image_urls);
  }, [housing.image_urls]);

  const isMock = isMockRecommendationHousing(housing.id);

  const onPress = useCallback(() => {
    if (isMock) {
      return;
    }
    router.push(href.mainHouseDetail(housing.id));
  }, [housing.id, isMock]);

  return (
    <Pressable
      onPress={onPress}
      disabled={isMock}
      style={({ pressed }) => [styles.card, pressed && !isMock && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={displayName}
    >
      <View style={styles.media}>
        {coverUri ? (
          <HousingFastImage uri={coverUri} style={styles.coverImage} priority="normal" />
        ) : (
          <View style={[styles.coverImage, styles.coverPlaceholder, { backgroundColor: c.cardMuted }]}>
            <Ionicons name="home-outline" size={32} color={c.hint} />
          </View>
        )}

        <View style={[styles.infoBar, { backgroundColor: infoColors.barBg }]}>
          <View style={styles.infoMain}>
            <ThemedText style={[styles.title, { color: infoColors.title }]} numberOfLines={1}>
              {displayName}
            </ThemedText>
            <ThemedText style={[styles.room, { color: infoColors.price }]} numberOfLines={1}>
              {roomLine}
            </ThemedText>
          </View>
          <ThemedText style={[styles.price, { color: infoColors.price }]} numberOfLines={2}>
            {displayPrice}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

const CARD_WIDTH = 268;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 18,
    overflow: "hidden",
  },
  cardPressed: {
    opacity: 0.94,
  },
  media: {
    width: CARD_WIDTH,
    aspectRatio: 4 / 3,
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  coverPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  infoBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  infoMain: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  price: {
    fontSize: 13,
    fontWeight: "700",
    maxWidth: "42%",
    textAlign: "right",
  },
  room: {
    fontSize: 11,
    fontWeight: "500",
    opacity: 0.9,
  },
});
