import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import {
  HousingFastImage,
  preloadHousingImages,
} from "@/src/features/housings/house-detail/upload-images/components/housing-fast-image";
import { getDefaultHousingCoverUri } from "@/src/features/housings/default-housing-cover";
import { formatListingPrice } from "@/src/features/housings/house-detail/utils";
import type { Housing } from "@/src/features/housings/types";
import type { Dictionary } from "@/src/i18n";
import { isHousingUpdatedToday } from "@/src/features/housings/home/utils/is-housing-updated-today";
import { href } from "@/src/navigation/href";
import { useAppTheme } from "@/src/theme";

type HomeCopy = Dictionary["home"];

export const HOUSING_LIST_CARD_CAROUSEL_WIDTH = 320;

type HousingListCardProps = {
  housing: Housing;
  copy: HomeCopy;
  contactForPrice: string;
  layout?: "full" | "carousel";
  showSaveButton?: boolean;
  saveAccessibilityLabel?: string;
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
  showSaveButton = false,
  saveAccessibilityLabel,
}: HousingListCardProps) {
  const isCarousel = layout === "carousel";
  const { colors: c, isDark } = useAppTheme();
  const [saved, setSaved] = useState(false);

  const hasListedPrice = housing.price != null && housing.price > 0;

  const infoColors = useMemo(
    () => ({
      barBg: isDark ? "rgba(38, 42, 48, 0.96)" : "rgba(71, 85, 105, 0.94)",
      title: "#FFFFFF",
      meta: "rgba(241, 245, 249, 0.92)",
      divider: "rgba(255, 255, 255, 0.28)",
    }),
    [isDark],
  );

  const priceBadgeColors = useMemo(
    () =>
      hasListedPrice
        ? {
            backgroundColor: c.primary,
            icon: "#FFFFFF",
            text: "#FFFFFF",
          }
        : {
            backgroundColor: "rgba(15, 23, 42, 0.88)",
            icon: "#F8FAFC",
            text: "#F8FAFC",
          },
    [c.primary, hasListedPrice],
  );

  const coverUri = housing.image_urls[0] ?? getDefaultHousingCoverUri(housing.id);
  const showNewBadge = isHousingUpdatedToday(housing.updated_at);

  const displayName = housing.house_name ?? copy.untitledHousing;
  const displayAddress = housing.address ?? copy.noAddress;
  const displayPrice = formatListingPrice(housing.price, contactForPrice);
  const roomLabel = housing.room_code
    ? `${copy.roomCodeLabel} ${housing.room_code}`
    : `${copy.roomCodeLabel} —`;
  const wifiLabel = housing.has_wifi ? copy.wifiAvailable : copy.wifiUnknown;

  useEffect(() => {
    preloadHousingImages(
      housing.image_urls.length > 0
        ? housing.image_urls
        : [getDefaultHousingCoverUri(housing.id)],
    );
  }, [housing.id, housing.image_urls]);

  const onViewDetails = useCallback(() => {
    router.push(href.mainHouseDetail(housing.id));
  }, [housing.id]);

  const onToggleSave = useCallback(() => {
    setSaved((value) => !value);
  }, []);

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
        <HousingFastImage
          uri={coverUri}
          style={styles.coverImage}
          contentFit="cover"
          priority="normal"
        />

        {showNewBadge ? (
          <View style={styles.newBadge}>
            <ThemedText style={styles.newBadgeText}>{copy.cardNewBadge}</ThemedText>
          </View>
        ) : null}

        {showSaveButton ? (
          <Pressable
            onPress={onToggleSave}
            accessibilityRole="button"
            accessibilityLabel={saveAccessibilityLabel}
            accessibilityState={{ selected: saved }}
            hitSlop={8}
            style={[
              styles.saveButton,
              {
                backgroundColor: saved ? c.primary : "rgba(15, 23, 42, 0.55)",
                borderColor: saved ? c.primary : "rgba(255, 255, 255, 0.22)",
              },
            ]}
          >
            <Ionicons
              name={saved ? "bookmark" : "bookmark-outline"}
              size={20}
              color="#FFFFFF"
            />
          </Pressable>
        ) : null}

        <View
          style={[
            styles.priceBadge,
            showSaveButton && styles.priceBadgeWithSave,
            { backgroundColor: priceBadgeColors.backgroundColor },
          ]}
          pointerEvents="none"
        >
          <Ionicons name="cash-sharp" size={14} color={priceBadgeColors.icon} />
          <ThemedText
            style={[styles.priceBadgeText, { color: priceBadgeColors.text }]}
            numberOfLines={1}
          >
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
  saveButton: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  priceBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    maxWidth: "52%",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 2,
  },
  priceBadgeWithSave: {
    right: 58,
    maxWidth: "46%",
  },
  priceBadgeText: {
    flexShrink: 1,
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
