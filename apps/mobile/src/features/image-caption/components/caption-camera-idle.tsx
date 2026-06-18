import { Pressable, StyleSheet, View } from "react-native";

import { CaptionScanFrame } from "@/src/features/image-caption/components/caption-scan-overlay";

type CaptionCameraIdleProps = {
  accessibilityLabel: string;
  onPress: () => void;
};

export function CaptionCameraIdle({ accessibilityLabel, onPress }: CaptionCameraIdleProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={styles.frame}
    >
      <CaptionScanFrame />
      <View style={styles.focusRing} pointerEvents="none" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  focusRing: {
    position: "absolute",
    alignSelf: "center",
    top: "50%",
    marginTop: -36,
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
});
