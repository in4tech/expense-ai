import { type ComponentProps } from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/src/theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

type Props = {
  icon: IconName;
  label: string;
  value: string;
};

export function OverviewStatCard({ icon, label, value }: Props) {
  const { colors: c } = useAppTheme();

  return (
    <View style={[styles.card, { backgroundColor: c.cardMuted, borderColor: c.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: c.chipOff }]}>
        <Ionicons name={icon} size={13} color={c.primary} />
      </View>
      <ThemedText style={[styles.label, { color: c.hint }]} numberOfLines={1}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.value, { color: c.title }]} numberOfLines={1}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 9,
    alignItems: "center",
    gap: 4,
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 10, fontWeight: "600" },
  value: { fontSize: 12, fontWeight: "700" },
});
