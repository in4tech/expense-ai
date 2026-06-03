import type { ComponentProps } from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/src/theme";

type FeeIconName = ComponentProps<typeof Ionicons>["name"];

type HomeFeeCellProps = {
  icon: FeeIconName;
  label: string;
  unit: string | null;
  value: string;
};

export function HomeFeeCell({ icon, label, unit, value }: HomeFeeCellProps) {
  const { colors: c } = useAppTheme();
  const isFree = value === "Free";
  const unitText = unit?.trim();

  return (
    <View style={[styles.cell, { backgroundColor: c.cardMuted }]}>
      <View style={styles.head}>
        <Ionicons name={icon} size={14} color={c.primary} />
        <ThemedText style={[styles.label, { color: c.text }]} numberOfLines={1}>
          {label}
        </ThemedText>
        {unitText ? (
          <ThemedText style={[styles.unit, { color: c.hint }]} numberOfLines={1}>
            {unitText}
          </ThemedText>
        ) : null}
      </View>
      <ThemedText
        style={[styles.value, { color: c.text }, isFree && styles.valueFree]}
        numberOfLines={1}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: "48%",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 4,
  },
  head: { flexDirection: "row", alignItems: "center", gap: 5 },
  label: { flex: 1, fontSize: 11, opacity: 0.8, minWidth: 0 },
  unit: { fontSize: 10, fontWeight: "600", flexShrink: 0 },
  value: { fontSize: 12, fontWeight: "600" },
  valueFree: { fontWeight: "800" },
});
