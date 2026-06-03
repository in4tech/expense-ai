import { useEffect, useRef } from "react";
import { Animated, Modal, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/src/theme";

type Props = {
  visible: boolean;
  message: string;
};

const BACKDROP = {
  light: "rgba(245, 247, 251, 0.78)",
  dark: "rgba(0, 0, 0, 0.58)",
} as const;

export function PredictLoadingOverlay({ visible, message }: Props) {
  const { colors: c, isDark } = useAppTheme();
  const pulse = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (!visible) {
      pulse.setValue(1);
      glow.setValue(0.4);
      return;
    }

    const blink = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.25, duration: 450, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 450, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 450, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0.35, duration: 450, useNativeDriver: true }),
        ]),
      ]),
    );

    blink.start();
    return () => blink.stop();
  }, [visible, pulse, glow]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.root}>
        <View
          style={[styles.backdrop, { backgroundColor: isDark ? BACKDROP.dark : BACKDROP.light }]}
        />
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: c.card,
              borderColor: c.border,
              opacity: pulse,
              transform: [
                {
                  scale: glow.interpolate({
                    inputRange: [0.35, 1],
                    outputRange: [0.96, 1.02],
                  }),
                },
              ],
            },
          ]}
        >
          <Animated.View style={{ opacity: glow }}>
            <Ionicons name="sparkles" size={36} color={c.primary} />
          </Animated.View>
          <ThemedText style={[styles.message, { color: c.title }]}>{message}</ThemedText>
          <View style={styles.dots}>
            {[0, 1, 2].map((i) => (
              <BlinkDot key={i} delay={i * 180} color={c.primary} active={visible} />
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function BlinkDot({
  delay,
  color,
  active,
}: {
  delay: number;
  color: string;
  active: boolean;
}) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!active) {
      opacity.setValue(0.3);
      return;
    }

    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.25, duration: 300, useNativeDriver: true }),
        Animated.delay(Math.max(0, 540 - delay)),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [active, delay, opacity]);

  return <Animated.View style={[styles.dot, { backgroundColor: color, opacity }]} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 28,
    paddingVertical: 24,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 200,
  },
  message: { fontSize: 15, fontWeight: "600", textAlign: "center" },
  dots: { flexDirection: "row", gap: 8, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
