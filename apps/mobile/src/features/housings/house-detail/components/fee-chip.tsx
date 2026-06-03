import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/src/theme";

type Props = {
  label: string;
  value: string;
  unit?: string | null;
};

export function FeeChip({ label, value, unit }: Props) {
  const { colors: c } = useAppTheme();
  const hasUnit = typeof unit === "string" && unit.trim().length > 0;
  const valueWithUnit = hasUnit ? `${value} ${unit}` : value;

  return (
    <View style={[styles.chip, { backgroundColor: c.chipOff }]}>
      <ThemedText style={[styles.label, { color: c.hint }]} numberOfLines={1}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.value, { color: c.title }]} numberOfLines={1}>
        {valueWithUnit}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    width: "48%",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 4,
  },
  label: { fontSize: 11 },
  value: { fontSize: 13, fontWeight: "700" },
});
