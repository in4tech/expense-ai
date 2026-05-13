import { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import type { ToastPayload, ToastStatus } from "@/components/toast/types";

const OFFSCREEN_Y = -160;

function statusIcon(status: ToastStatus): keyof typeof Ionicons.glyphMap {
  switch (status) {
    case "success":
      return "checkmark-circle";
    case "warning":
      return "warning";
    case "error":
      return "alert-circle";
  }
}

type ToastBannerProps = {
  toast: ToastPayload;
  isDark: boolean;
  onDismissed: () => void;
  onExposeDismiss: (dismiss: (() => void) | null) => void;
};

export function ToastBanner({
  toast,
  isDark,
  onDismissed,
  onExposeDismiss,
}: ToastBannerProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(OFFSCREEN_Y)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const exitingRef = useRef(false);

  const palette = isDark
    ? {
        card: "#2C2C2E",
        border: "#48484A",
        title: "#F2F2F7",
        description: "#AEAEB2",
        success: "#34C759",
        warning: "#FF9F0A",
        error: "#FF453A",
      }
    : {
        card: "#FFFFFF",
        border: "#E5E5EA",
        title: "#1A1A1A",
        description: "#636366",
        success: "#248A3D",
        warning: "#C93400",
        error: "#D70015",
      };

  const accent =
    toast.status === "success"
      ? palette.success
      : toast.status === "warning"
        ? palette.warning
        : palette.error;

  const runExit = useCallback(() => {
    if (exitingRef.current) {
      return;
    }
    exitingRef.current = true;
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: OFFSCREEN_Y,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      exitingRef.current = false;
      if (finished) {
        onDismissed();
      }
    });
  }, [onDismissed, opacity, translateY]);

  const runExitRef = useRef(runExit);
  runExitRef.current = runExit;

  useEffect(() => {
    onExposeDismiss(runExit);
    return () => {
      onExposeDismiss(null);
    };
  }, [onExposeDismiss, runExit]);

  useEffect(() => {
    exitingRef.current = false;
    translateY.setValue(OFFSCREEN_Y);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      runExitRef.current();
    }, toast.durationMs);
    return () => {
      clearTimeout(timer);
    };
  }, [toast.id, toast.durationMs, opacity, translateY]);

  const desc = toast.description?.trim();

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.root,
        {
          paddingTop: insets.top + 8,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Pressable
        accessibilityRole="alert"
        onPress={runExit}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: palette.card,
            borderColor: palette.border,
            borderLeftWidth: 4,
            borderLeftColor: accent,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${accent}22` }]}>
          <Ionicons name={statusIcon(toast.status)} size={26} color={accent} />
        </View>
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: palette.title }]} numberOfLines={2}>
            {toast.title}
          </Text>
          {desc ? (
            <Text style={[styles.description, { color: palette.description }]} numberOfLines={4}>
              {desc}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    zIndex: 9999,
    elevation: 9999,
    paddingHorizontal: 14,
    alignItems: "stretch",
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    paddingHorizontal: 14,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
});
