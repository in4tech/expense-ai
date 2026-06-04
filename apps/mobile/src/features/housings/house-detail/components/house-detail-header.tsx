import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/src/theme";

type Props = {
  title: string;
  onUploadPress?: () => void;
  uploadDisabled?: boolean;
  uploadAccessibilityLabel?: string;
  onFavoritePress?: () => void;
  favoriteAccessibilityLabel?: string;
};

export function HouseDetailHeader({
  title,
  onUploadPress,
  uploadDisabled = false,
  uploadAccessibilityLabel,
  onFavoritePress,
  favoriteAccessibilityLabel,
}: Props) {
  const { colors: c } = useAppTheme();
  const actionCount = (onFavoritePress ? 1 : 0) + (onUploadPress ? 1 : 0);
  const sideWidth = actionCount === 2 ? 88 : 40;

  return (
    <View style={styles.header}>
      <View style={[styles.sideSlot, { width: sideWidth }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconBtn, { borderColor: c.border, backgroundColor: c.card }]}
        >
          <Ionicons name="chevron-back" size={20} color={c.title} />
        </Pressable>
      </View>
      <ThemedText style={[styles.headerTitle, { color: c.title }]} numberOfLines={1}>
        {title}
      </ThemedText>
      <View style={[styles.sideSlot, styles.rightSlot, { width: sideWidth }]}>
        {onFavoritePress ? (
          <Pressable
            onPress={onFavoritePress}
            accessibilityRole="button"
            accessibilityLabel={favoriteAccessibilityLabel}
            style={[styles.iconBtn, { borderColor: c.border, backgroundColor: c.card }]}
          >
            <Ionicons name="heart-outline" size={20} color={c.danger} />
          </Pressable>
        ) : null}
        {onUploadPress ? (
          <Pressable
            onPress={onUploadPress}
            disabled={uploadDisabled}
            accessibilityLabel={uploadAccessibilityLabel}
            accessibilityRole="button"
            style={[
              styles.iconBtn,
              { borderColor: c.border, backgroundColor: c.card },
              onFavoritePress ? styles.iconBtnSpaced : null,
              uploadDisabled && styles.iconBtnDisabled,
            ]}
          >
            <Ionicons name="images-outline" size={20} color={c.title} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    flexShrink: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    marginHorizontal: 8,
  },
  sideSlot: {
    flexShrink: 0,
  },
  rightSlot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  iconBtnSpaced: {
    marginLeft: 8,
  },
  iconBtnDisabled: { opacity: 0.45 },
});
