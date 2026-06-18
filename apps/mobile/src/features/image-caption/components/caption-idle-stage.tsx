import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

import { ThemedText } from "@/components/themed-text";
import { CaptionScanFrame } from "@/src/features/image-caption/components/caption-scan-overlay";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type CaptionIdleStageProps = {
  mode: "camera" | "gallery";
  title: string;
  subtitle: string;
  hint: string;
  accessibilityLabel: string;
  onPress: () => void;
};

const MODE_ICON: Record<CaptionIdleStageProps["mode"], IoniconName> = {
  camera: "camera-outline",
  gallery: "images-outline",
};

export function CaptionIdleStage({
  mode,
  title,
  subtitle,
  hint,
  accessibilityLabel,
  onPress,
}: CaptionIdleStageProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={styles.frame}
    >
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />
      <View style={styles.grid} pointerEvents="none">
        <View style={[styles.gridLine, styles.gridVerticalLeft]} />
        <View style={[styles.gridLine, styles.gridVerticalRight]} />
        <View style={[styles.gridLine, styles.gridHorizontalTop]} />
        <View style={[styles.gridLine, styles.gridHorizontalBottom]} />
      </View>

      <CaptionScanFrame />

      <View style={styles.center}>
        <View style={styles.iconOrb}>
          <Ionicons name={MODE_ICON[mode]} size={28} color="#86EFAC" />
        </View>
        <ThemedText style={styles.title}>{title}</ThemedText>
        <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
      </View>

      <View style={styles.hintPill} pointerEvents="none">
        <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.72)" />
        <ThemedText style={styles.hint}>{hint}</ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(12, 14, 18, 0.88)",
  },
  glowTop: {
    position: "absolute",
    top: -48,
    alignSelf: "center",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(134, 239, 172, 0.07)",
  },
  glowBottom: {
    position: "absolute",
    bottom: -64,
    alignSelf: "center",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLine: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  gridVerticalLeft: {
    top: 0,
    bottom: 0,
    left: "33.33%",
    width: StyleSheet.hairlineWidth,
  },
  gridVerticalRight: {
    top: 0,
    bottom: 0,
    left: "66.66%",
    width: StyleSheet.hairlineWidth,
  },
  gridHorizontalTop: {
    left: 0,
    right: 0,
    top: "33.33%",
    height: StyleSheet.hairlineWidth,
  },
  gridHorizontalBottom: {
    left: 0,
    right: 0,
    top: "66.66%",
    height: StyleSheet.hairlineWidth,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 8,
  },
  iconOrb: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(134, 239, 172, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(134, 239, 172, 0.28)",
    marginBottom: 4,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    maxWidth: 260,
  },
  hintPill: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(0, 0, 0, 0.42)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  hint: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
});
