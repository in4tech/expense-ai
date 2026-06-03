import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/src/theme";

type Props = {
  label: string;
  checked: boolean;
  detail?: string;
};

export function CheckboxRow({ label, checked, detail }: Props) {
  const { colors: c } = useAppTheme();

  return (
    <View style={styles.row}>
      <Ionicons
        name={checked ? "checkbox" : "checkbox-outline"}
        size={22}
        color={checked ? c.success : c.hint}
      />
      <View style={styles.textCol}>
        <ThemedText
          style={[styles.label, { color: checked ? c.title : c.hint }]}
          numberOfLines={2}
        >
          {label}
        </ThemedText>
        {detail ? (
          <ThemedText style={[styles.detail, { color: c.text }]} numberOfLines={3}>
            {detail}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  textCol: { flex: 1, gap: 2 },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "500" },
  detail: { fontSize: 13, lineHeight: 18 },
});
