import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

import { ThemedText } from "@/components/themed-text";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type CaptionModeBadgeProps = {
  mode: "camera" | "gallery";
  label: string;
};

const MODE_ICON: Record<CaptionModeBadgeProps["mode"], IoniconName> = {
  camera: "camera-outline",
  gallery: "images-outline",
};

export function CaptionModeBadge({ mode, label }: CaptionModeBadgeProps) {
  return (
    <View style={styles.badge} pointerEvents="none">
      <Ionicons name={MODE_ICON[mode]} size={13} color="#86EFAC" />
      <ThemedText style={styles.label}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(134, 239, 172, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(134, 239, 172, 0.28)",
  },
  label: {
    color: "#86EFAC",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
