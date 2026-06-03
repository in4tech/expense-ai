import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/src/theme";

type Props = {
  label: string;
  required?: boolean;
  trailing?: ReactNode;
};

export function PredictFieldLabel({ label, required, trailing }: Props) {
  const { colors: c } = useAppTheme();

  return (
    <View style={styles.row}>
      <View style={styles.labelWrap}>
        <ThemedText style={[styles.label, { color: c.hint }]}>{label}</ThemedText>
        {required ? (
          <ThemedText style={[styles.required, { color: c.danger }]}> *</ThemedText>
        ) : null}
      </View>
      {trailing ?? null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  labelWrap: { flexDirection: "row", alignItems: "center", flexShrink: 1 },
  label: { fontSize: 12, fontWeight: "500" },
  required: { fontSize: 12, fontWeight: "700" },
});
