import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { HousingFastImage, preloadHousingImages } from "@/src/features/housings/house-detail/upload-images/components/housing-fast-image";
import { HousingUploadImagePreviewModal } from "@/src/features/housings/house-detail/upload-images/components/housing-upload-image-preview-modal";
import type { PendingHousingImage } from "@/src/features/housings/house-detail/upload-images/types";
import type { Dictionary } from "@/src/i18n";
import { useAppTheme } from "@/src/theme";

const NUM_COLUMNS = 3;
const GAP = 10;

type Props = {
  imageUrls: string[];
  labels: Dictionary["houseDetail"];
};

const toPreviewImages = (urls: string[]): PendingHousingImage[] =>
  urls.map((uri, index) => ({
    id: `housing-image-${index}`,
    uri,
    name: `image-${index + 1}`,
    mimeType: "image/jpeg",
  }));

export function HouseDetailImagesSection({ imageUrls, labels: d }: Props) {
  const { colors: c } = useAppTheme();
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const previewImages = useMemo(() => toPreviewImages(imageUrls), [imageUrls]);

  useEffect(() => {
    preloadHousingImages(imageUrls);
  }, [imageUrls]);

  const onClosePreview = useCallback(() => {
    setPreviewIndex(null);
  }, []);

  if (imageUrls.length === 0) {
    return (
      <ThemedText style={[styles.empty, { color: c.hint }]}>{d.noImages}</ThemedText>
    );
  }

  return (
    <>
      <FlatList
        data={imageUrls}
        keyExtractor={(uri, index) => `${uri}-${index}`}
        numColumns={NUM_COLUMNS}
        scrollEnabled={false}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        renderItem={({ item: uri, index }) => (
          <Pressable
            onPress={() => setPreviewIndex(index)}
            accessibilityRole="button"
            accessibilityLabel={d.uploadViewImage}
            style={[styles.cell, { borderColor: c.border, backgroundColor: c.cardMuted }]}
          >
            <HousingFastImage uri={uri} style={styles.thumb} contentFit="cover" priority="normal" />
          </Pressable>
        )}
      />

      <HousingUploadImagePreviewModal
        visible={previewIndex != null}
        images={previewImages}
        initialIndex={previewIndex ?? 0}
        closeAccessibilityLabel={d.uploadClosePreview}
        onClose={onClosePreview}
      />
    </>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: 14, lineHeight: 20 },
  grid: { gap: GAP },
  row: { gap: GAP },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  thumb: { width: "100%", height: "100%" },
});
