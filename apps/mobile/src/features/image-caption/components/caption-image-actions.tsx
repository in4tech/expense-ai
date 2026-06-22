import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";

type CaptionImageActionsProps = {
  visible: boolean;
  changeLabel: string;
  clearLabel: string;
  changeA11y: string;
  clearA11y: string;
  onChange: () => void;
  onClear: () => void;
};

export function CaptionImageActions({
  visible,
  changeLabel,
  clearLabel,
  changeA11y,
  clearA11y,
  onChange,
  onClear,
}: CaptionImageActionsProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={changeA11y}
        onPress={onChange}
        style={({ pressed }) => [styles.changeButton, pressed ? styles.pressed : null]}
      >
        <Ionicons name="image-outline" size={15} color="#14532D" />
        <ThemedText style={styles.changeLabel}>{changeLabel}</ThemedText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={clearA11y}
        onPress={onClear}
        style={({ pressed }) => [styles.clearButton, pressed ? styles.pressed : null]}
      >
        <Ionicons name="close-circle-outline" size={15} color="#FFFFFF" />
        <ThemedText style={styles.clearLabel}>{clearLabel}</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 10,
  },
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#86EFAC",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.38)",
  },
  changeLabel: {
    color: "#14532D",
    fontSize: 13,
    fontWeight: "700",
  },
  clearLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.85,
  },
});
