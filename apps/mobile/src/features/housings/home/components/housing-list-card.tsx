import { useCallback, useEffect, useMemo } from "react";
import type { ComponentProps } from "react";
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
import { href } from "@/src/navigation/href";
import { useAppTheme } from "@/src/theme";

type HomeCopy = Dictionary["home"];

export const HOUSING_LIST_CARD_CAROUSEL_WIDTH = 320;

type HousingListCardProps = {
  housing: Housing;
  copy: HomeCopy;
  contactForPrice: string;
  layout?: "full" | "carousel";
};

type IoniconName = ComponentProps<typeof Ionicons>["name"];

function MetaDivider({ color }: { color: string }) {
  return <View style={[styles.metaDivider, { backgroundColor: color }]} />;
}

function MetaItem({
  icon,
  label,
  flex,
  iconColor,
  textColor,
}: {
  icon: IoniconName;
  label: string;
  flex?: number;
  iconColor: string;
  textColor: string;
}) {
  return (
    <View style={[styles.metaItem, flex != null && { flex }]}>
      <Ionicons name={icon} size={15} color={iconColor} />
      <ThemedText style={[styles.metaText, { color: textColor }]} numberOfLines={1}>
        {label}
      </ThemedText>
    </View>
  );
}

export function HousingListCard({
  housing,
  copy,
  contactForPrice,
  layout = "full",
}: HousingListCardProps) {
  const isCarousel = layout === "carousel";
  const { colors: c, isDark } = useAppTheme();

  const infoColors = useMemo(
    () => ({
      barBg: isDark ? "rgba(38, 42, 48, 0.96)" : "rgba(71, 85, 105, 0.94)",
      title: "#FFFFFF",
      meta: "rgba(241, 245, 249, 0.92)",
      divider: "rgba(255, 255, 255, 0.28)",
    }),
    [isDark],
  );
  const coverUri = housing.image_urls[0];
  const hasPhotos = housing.image_urls.length > 0;

  const displayName = housing.house_name ?? copy.untitledHousing;
  const displayAddress = housing.address ?? copy.noAddress;
  const displayPrice = formatListingPrice(housing.price, contactForPrice);
  const roomLabel = housing.room_code
    ? `${copy.roomCodeLabel} ${housing.room_code}`
    : `${copy.roomCodeLabel} —`;
  const wifiLabel = housing.has_wifi ? copy.wifiAvailable : copy.wifiUnknown;

  useEffect(() => {
    preloadHousingImages(housing.image_urls);
  }, [housing.image_urls]);

  const onViewDetails = useCallback(() => {
    router.push(href.mainHouseDetail(housing.id));
  }, [housing.id]);

  return (
    <Pressable
      onPress={onViewDetails}
      style={({ pressed }) => [
        styles.card,
        isCarousel && styles.cardCarousel,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={displayName}
    >
      <View style={[styles.media, isCarousel && styles.mediaCarousel]}>
        {coverUri ? (
          <HousingFastImage uri={coverUri} style={styles.coverImage} priority="normal" />
        ) : (
          <View style={[styles.coverImage, styles.coverPlaceholder, { backgroundColor: c.cardMuted }]}>
            <Ionicons name="home-outline" size={44} color={c.hint} />
          </View>
        )}

        {hasPhotos ? (
          <View style={styles.newBadge}>
            <ThemedText style={styles.newBadgeText}>{copy.cardNewBadge}</ThemedText>
          </View>
        ) : null}

        <View style={styles.priceBadge} pointerEvents="none">
          <Ionicons name="cash-sharp" size={14} color="#F8FAFC" />
          <ThemedText style={styles.priceBadgeText} numberOfLines={1}>
            {displayPrice}
          </ThemedText>
        </View>

        <View
          style={[styles.infoBar, { backgroundColor: infoColors.barBg }]}
          pointerEvents="none"
        >
          <ThemedText style={[styles.title, { color: infoColors.title }]} numberOfLines={1}>
            {displayName}
          </ThemedText>

          <View style={styles.metaRow}>
            <MetaItem
              icon="bed-outline"
              label={roomLabel}
              iconColor={infoColors.meta}
              textColor={infoColors.meta}
            />
            <MetaDivider color={infoColors.divider} />
            <MetaItem
              icon={housing.has_wifi ? "wifi" : "wifi-outline"}
              label={wifiLabel}
              iconColor={infoColors.meta}
              textColor={infoColors.meta}
            />
            <MetaDivider color={infoColors.divider} />
            <MetaItem
              icon="resize-outline"
              label={displayAddress}
              flex={1}
              iconColor={infoColors.meta}
              textColor={infoColors.meta}
            />
          </View>
        </View>
      </View>
    </Pressable>
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
  cardPressed: {
    opacity: 0.94,
  },
  media: {
    width: "100%",
    aspectRatio: 4 / 3,
  },
  mediaCarousel: {
    width: HOUSING_LIST_CARD_CAROUSEL_WIDTH,
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
  newBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    zIndex: 2,
  },
  newBadgeText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  priceBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    maxWidth: "52%",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 2,
  },
  priceBadgeText: {
    flexShrink: 1,
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  infoBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 12,
    gap: 8,
    zIndex: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexShrink: 1,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "500",
    flexShrink: 1,
  },
  metaDivider: {
    width: 1,
    height: 14,
  },
});
