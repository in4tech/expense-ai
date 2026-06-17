import { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";

type CaptionResultCardProps = {
  visible: boolean;
  label: string;
  caption: string;
};

export function CaptionResultCard({ visible, label, caption }: CaptionResultCardProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      translateY.setValue(24);
      scale.setValue(0.96);
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 70,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, [caption, opacity, scale, translateY, visible]);

  if (!visible || !caption) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <ThemedText style={styles.label}>{label}</ThemedText>
      <ThemedText style={styles.caption}>{caption}</ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.94)",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  label: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  caption: {
    color: "#166534",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
});
