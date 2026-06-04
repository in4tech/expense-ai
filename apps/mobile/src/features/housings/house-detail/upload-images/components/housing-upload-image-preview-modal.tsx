import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import {
  HousingFastImage,
  preloadHousingImages,
} from "@/src/features/housings/house-detail/upload-images/components/housing-fast-image";
import type { PendingHousingImage } from "@/src/features/housings/house-detail/upload-images/types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type Props = {
  visible: boolean;
  images: PendingHousingImage[];
  initialIndex: number;
  closeAccessibilityLabel: string;
  onClose: () => void;
};

export function HousingUploadImagePreviewModal({
  visible,
  images,
  initialIndex,
  closeAccessibilityLabel,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<PendingHousingImage>>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const index = Math.min(Math.max(initialIndex, 0), Math.max(images.length - 1, 0));
    setActiveIndex(index);
    preloadHousingImages(images.map((img) => img.uri));
    requestAnimationFrame(() => {
      if (images.length > 0) {
        listRef.current?.scrollToIndex({ index, animated: false });
      }
    });
  }, [visible, initialIndex, images]);

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (index >= 0 && index < images.length) {
      setActiveIndex(index);
    }
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <FlatList
          ref={listRef}
          data={images}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={Math.min(initialIndex, images.length - 1)}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          onMomentumScrollEnd={onScrollEnd}
          onScrollToIndexFailed={({ index }) => {
            listRef.current?.scrollToOffset({
              offset: SCREEN_WIDTH * index,
              animated: false,
            });
          }}
          renderItem={({ item }) => (
            <View style={styles.page}>
              <HousingFastImage
                uri={item.uri}
                style={styles.image}
                contentFit="contain"
                priority="high"
                accessibilityLabel={item.name}
              />
            </View>
          )}
        />

        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <ThemedText style={styles.counter}>
            {activeIndex + 1} / {images.length}
          </ThemedText>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={closeAccessibilityLabel}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
  },
  page: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.82,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  counter: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
});
