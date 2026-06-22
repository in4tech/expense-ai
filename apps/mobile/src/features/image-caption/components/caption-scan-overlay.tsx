import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

const SCAN_LINE_HEIGHT = 2;
const SCAN_TRAIL_HEIGHT = 64;
const SCAN_DURATION_MS = 2200;
const FRAME_CORNER = 28;

type CaptionScanOverlayProps = {
  active: boolean;
  label: string;
};

export function CaptionScanOverlay({ active, label }: CaptionScanOverlayProps) {
  const scanY = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.55)).current;
  const dotPulse = useRef(new Animated.Value(0.5)).current;
  const [frameHeight, setFrameHeight] = useState(0);

  useEffect(() => {
    if (!active || frameHeight <= 0) {
      scanY.setValue(0);
      pulse.setValue(0.55);
      dotPulse.setValue(0.5);
      return;
    }

    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanY, {
          toValue: frameHeight,
          duration: SCAN_DURATION_MS,
          useNativeDriver: true,
        }),
        Animated.timing(scanY, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.82, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    );

    const dotLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(dotPulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(dotPulse, { toValue: 0.35, duration: 500, useNativeDriver: true }),
      ]),
    );

    scanLoop.start();
    pulseLoop.start();
    dotLoop.start();

    return () => {
      scanLoop.stop();
      pulseLoop.stop();
      dotLoop.stop();
    };
  }, [active, dotPulse, frameHeight, pulse, scanY]);

  if (!active) {
    return null;
  }

  return (
    <View
      style={styles.overlay}
      onLayout={(event) => {
        setFrameHeight(event.nativeEvent.layout.height);
      }}
      pointerEvents="auto"
    >
      <Animated.View style={[styles.dim, { opacity: pulse }]} />

      <View style={styles.corners} pointerEvents="none">
        <View style={[styles.corner, styles.cornerTopLeft]} />
        <View style={[styles.corner, styles.cornerTopRight]} />
        <View style={[styles.corner, styles.cornerBottomLeft]} />
        <View style={[styles.corner, styles.cornerBottomRight]} />
      </View>

      {frameHeight > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.scanBeam,
            {
              transform: [
                {
                  translateY: scanY.interpolate({
                    inputRange: [0, frameHeight],
                    outputRange: [-SCAN_TRAIL_HEIGHT, frameHeight - SCAN_LINE_HEIGHT],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.scanTrail} />
          <View style={styles.scanLine} />
        </Animated.View>
      ) : null}

      <View style={styles.statusWrap} pointerEvents="none">
        <View style={styles.statusPill}>
          <Animated.View style={[styles.statusDot, { opacity: dotPulse }]} />
          <ThemedText style={styles.statusText}>{label}</ThemedText>
        </View>
      </View>
    </View>
  );
}

export function CaptionScanFrame() {
  return (
    <View style={styles.frameCorners} pointerEvents="none">
      <View style={[styles.corner, styles.cornerTopLeft]} />
      <View style={[styles.corner, styles.cornerTopRight]} />
      <View style={[styles.corner, styles.cornerBottomLeft]} />
      <View style={[styles.corner, styles.cornerBottomRight]} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    borderRadius: 24,
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.28)",
  },
  corners: {
    ...StyleSheet.absoluteFillObject,
  },
  frameCorners: {
    ...StyleSheet.absoluteFillObject,
  },
  corner: {
    position: "absolute",
    width: FRAME_CORNER,
    height: FRAME_CORNER,
    borderColor: "#FFFFFF",
    borderWidth: 3,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 18,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 18,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 18,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 18,
  },
  scanBeam: {
    position: "absolute",
    left: 0,
    right: 0,
    height: SCAN_TRAIL_HEIGHT + SCAN_LINE_HEIGHT,
  },
  scanTrail: {
    height: SCAN_TRAIL_HEIGHT,
    backgroundColor: "#FFFFFF",
    opacity: 0.16,
  },
  scanLine: {
    height: SCAN_LINE_HEIGHT,
    backgroundColor: "#FFFFFF",
    opacity: 0.95,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  statusWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 14,
    alignItems: "center",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#86EFAC",
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
