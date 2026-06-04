import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { HousingFastImage } from "@/src/features/housings/house-detail/upload-images/components/housing-fast-image";
import type { PendingHousingImage } from "@/src/features/housings/house-detail/upload-images/types";
import { useAppTheme } from "@/src/theme";

const NUM_COLUMNS = 3;
const GAP = 10;

type Props = {
  images: PendingHousingImage[];
  viewAccessibilityLabel: string;
  removeAccessibilityLabel: string;
  onPressImage: (image: PendingHousingImage) => void;
  onRemove: (id: string) => void;
};

export function HousingUploadImageGrid({
  images,
  viewAccessibilityLabel,
  removeAccessibilityLabel,
  onPressImage,
  onRemove,
}: Props) {
  const { colors: c } = useAppTheme();

  return (
    <FlatList
      data={images}
      keyExtractor={(item) => item.id}
      numColumns={NUM_COLUMNS}
      scrollEnabled={false}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.cell}>
          <Pressable
            onPress={() => onPressImage(item)}
            accessibilityRole="button"
            accessibilityLabel={viewAccessibilityLabel}
            style={styles.thumbPressable}
          >
            <HousingFastImage uri={item.uri} style={styles.thumb} contentFit="cover" priority="normal" />
          </Pressable>
          <Pressable
            onPress={() => onRemove(item.id)}
            accessibilityRole="button"
            accessibilityLabel={removeAccessibilityLabel}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.removeBtn, { backgroundColor: c.card }]}
          >
            <Ionicons name="close-circle" size={22} color={c.danger} />
          </Pressable>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { gap: GAP },
  row: { gap: GAP },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  thumbPressable: { flex: 1 },
  thumb: { width: "100%", height: "100%" },
  removeBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    borderRadius: 999,
  },
});
