import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";

type CaptionNextActionsProps = {
  visible: boolean;
  askAiLabel: string;
  newPhotoLabel: string;
  askAiA11y: string;
  newPhotoA11y: string;
  onAskAi: () => void;
  onNewPhoto: () => void;
};

export function CaptionNextActions({
  visible,
  askAiLabel,
  newPhotoLabel,
  askAiA11y,
  newPhotoA11y,
  onAskAi,
  onNewPhoto,
}: CaptionNextActionsProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      translateY.setValue(16);
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay: 120,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 70,
        delay: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, visible]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={[styles.wrap, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={askAiA11y}
          onPress={onAskAi}
          style={({ pressed }) => [styles.primaryButton, pressed ? styles.pressed : null]}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#14532D" />
          <ThemedText style={styles.primaryLabel}>{askAiLabel}</ThemedText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={newPhotoA11y}
          onPress={onNewPhoto}
          style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
        >
          <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
          <ThemedText style={styles.secondaryLabel}>{newPhotoLabel}</ThemedText>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
    gap: 10,
  },
  title: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#86EFAC",
  },
  secondaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },
  primaryLabel: {
    color: "#14532D",
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.82,
  },
});
