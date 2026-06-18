import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { CaptionScanFrame } from "@/src/features/image-caption/components/caption-scan-overlay";

type CaptionGalleryIdleProps = {
  hint: string;
  accessibilityLabel: string;
  onPress: () => void;
};

export function CaptionGalleryIdle({ hint, accessibilityLabel, onPress }: CaptionGalleryIdleProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={styles.frame}
    >
      <CaptionScanFrame />
      <Ionicons name="images-outline" size={36} color="rgba(255,255,255,0.55)" />
      <ThemedText style={styles.hint}>{hint}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 24,
  },
  hint: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
