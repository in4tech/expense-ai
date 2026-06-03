import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/src/theme";

type Props = {
  label: string;
  value: string;
};

export function MetaRow({ label, value }: Props) {
  const { colors: c } = useAppTheme();

  return (
    <View style={styles.row}>
      <ThemedText style={[styles.label, { color: c.hint }]} numberOfLines={2}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.value, { color: c.title }]} numberOfLines={3}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 4 },
  label: { fontSize: 12, fontWeight: "600" },
  value: { fontSize: 14, lineHeight: 20 },
});
