import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import {
  HousingFastImage,
  preloadHousingImages,
} from "@/src/features/housings/house-detail/upload-images/components/housing-fast-image";
import { HousingUploadImagePreviewModal } from "@/src/features/housings/house-detail/upload-images/components/housing-upload-image-preview-modal";
import type { PendingHousingImage } from "@/src/features/housings/house-detail/upload-images/types";
import { formatVndPrice } from "@/src/features/housings/house-detail/utils";
import type { HousingDetail } from "@/src/features/housings/types";
import type { Dictionary } from "@/src/i18n";
import { useAppTheme } from "@/src/theme";

const SLIDE_INTERVAL_MS = 4000;

const toPreviewImages = (urls: string[]): PendingHousingImage[] =>
  urls.map((uri, index) => ({
    id: `hero-image-${index}`,
    uri,
    name: `image-${index + 1}`,
    mimeType: "image/jpeg",
  }));

type Props = {
  housing: HousingDetail;
  labels: Dictionary["houseDetail"];
  homeLabels: Dictionary["home"];
};

export function HouseDetailHero({
  housing,
  labels: d,
  homeLabels,
}: Props) {
  const { colors: c } = useAppTheme();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [slideWidth, setSlideWidth] = useState(0);
  const listRef = useRef<FlatList<string>>(null);
  const imageUrls = housing.image_urls;
  const previewImages = useMemo(() => toPreviewImages(imageUrls), [imageUrls]);
  const hasSlides = imageUrls.length > 0 && slideWidth > 0;

  useEffect(() => {
    preloadHousingImages(imageUrls);
  }, [imageUrls]);

  useEffect(() => {
    setSlideIndex(0);
    if (hasSlides) {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [imageUrls, hasSlides]);

  useEffect(() => {
    if (!hasSlides || imageUrls.length <= 1 || previewOpen) {
      return;
    }

    const timer = setInterval(() => {
      setSlideIndex((prev) => {
        const next = (prev + 1) % imageUrls.length;
        listRef.current?.scrollToOffset({
          offset: next * slideWidth,
          animated: true,
        });
        return next;
      });
    }, SLIDE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [hasSlides, imageUrls.length, previewOpen, slideWidth]);

  const onSlideEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (slideWidth <= 0) {
        return;
      }
      const index = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
      if (index >= 0 && index < imageUrls.length) {
        setSlideIndex(index);
      }
    },
    [imageUrls.length, slideWidth],
  );

  const onOpenPreview = useCallback(() => {
    if (imageUrls.length > 0) {
      setPreviewOpen(true);
    }
  }, [imageUrls.length]);

  return (
    <View style={[styles.hero, { backgroundColor: c.card, borderColor: c.border }]}>
      <View
        style={[styles.media, { backgroundColor: c.cardMuted }]}
        onLayout={(event) => setSlideWidth(event.nativeEvent.layout.width)}
      >
        {imageUrls.length > 0 ? (
          <FlatList
            ref={listRef}
            data={imageUrls}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={imageUrls.length > 1}
            keyExtractor={(uri, index) => `${uri}-${index}`}
            style={styles.carousel}
            getItemLayout={(_, index) => ({
              length: slideWidth,
              offset: slideWidth * index,
              index,
            })}
            onMomentumScrollEnd={onSlideEnd}
            onScrollToIndexFailed={({ index }) => {
              listRef.current?.scrollToOffset({
                offset: slideWidth * index,
                animated: true,
              });
            }}
            renderItem={({ item }) => (
              <Pressable
                onPress={onOpenPreview}
                accessibilityRole="button"
                accessibilityLabel={d.uploadViewImage}
                style={[styles.slide, { width: slideWidth }]}
              >
                <HousingFastImage
                  uri={item}
                  style={styles.mediaImage}
                  contentFit="cover"
                  priority="high"
                />
              </Pressable>
            )}
          />
        ) : (
          <View style={[styles.mediaPlaceholder, { backgroundColor: c.cardMuted }]}>
            <Ionicons name="image-outline" size={40} color={c.hint} />
          </View>
        )}

        <View style={styles.mediaOverlay} pointerEvents="box-none">
          <View style={styles.mediaTopRow}>
            <View style={[styles.priceTag, { backgroundColor: c.card }]}>
              <ThemedText style={[styles.priceTagLabel, { color: c.hint }]}>{d.rentLabel}</ThemedText>
              <ThemedText style={[styles.priceTagValue, { color: c.primary }]}>
                {housing.price != null ? formatVndPrice(housing.price) : d.contactForPrice}
              </ThemedText>
            </View>
          </View>
        </View>

        {imageUrls.length > 1 ? (
          <View style={styles.dotsOverlay} pointerEvents="none">
            <View style={styles.dotsRow}>
              {imageUrls.map((uri, index) => (
                <View
                  key={`${uri}-dot-${index}`}
                  style={[
                    styles.dot,
                    index === slideIndex ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <HousingUploadImagePreviewModal
        visible={previewOpen}
        images={previewImages}
        initialIndex={slideIndex}
        closeAccessibilityLabel={d.uploadClosePreview}
        onClose={() => setPreviewOpen(false)}
      />
      <View style={styles.textCol}>
        <ThemedText style={[styles.name, { color: c.title }]} numberOfLines={2}>
          {housing.house_name ?? homeLabels.untitledHousing}
        </ThemedText>
        <View style={styles.metaRow}>
          <Ionicons name="pricetag-outline" size={14} color={c.hint} />
          <ThemedText style={[styles.meta, { color: c.hint }]}>
            {homeLabels.roomCodeLabel}: {housing.room_code ?? d.unknown}
          </ThemedText>
        </View>
        <View style={[styles.addressRow, { borderTopColor: c.border }]}>
          <Ionicons name="location-outline" size={17} color={c.primary} />
          <ThemedText style={[styles.address, { color: c.text }]}>
            {housing.address ?? homeLabels.noAddress}
          </ThemedText>
        </View>
        <View style={styles.wifiRow}>
          <Ionicons
            name={housing.has_wifi ? "wifi" : "wifi-outline"}
            size={16}
            color={housing.has_wifi ? c.success : c.hint}
          />
          <ThemedText style={{ color: c.text, fontSize: 13 }}>
            {housing.has_wifi ? homeLabels.wifiAvailable : homeLabels.wifiUnknown}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  media: {
    height: 184,
    borderRadius: 18,
    overflow: "hidden",
  },
  carousel: {
    ...StyleSheet.absoluteFillObject,
  },
  slide: {
    height: "100%",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
  },
  mediaPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 10,
  },
  dotsOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 10,
    alignItems: "center",
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  priceTag: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 110,
    gap: 2,
    maxWidth: "72%",
  },
  dot: {
    height: 6,
    borderRadius: 999,
  },
  dotActive: {
    width: 16,
    backgroundColor: "#FFFFFF",
  },
  dotInactive: {
    width: 6,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  mediaTopRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-start",
  },
  textCol: { flex: 1, gap: 6 },
  name: { fontSize: 21, fontWeight: "800", lineHeight: 27 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  meta: { fontSize: 13 },
  priceTagLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  priceTagValue: { fontSize: 15, fontWeight: "800" },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  address: { flex: 1, fontSize: 14, lineHeight: 20 },
  wifiRow: { flexDirection: "row", alignItems: "center", gap: 8 },
});
