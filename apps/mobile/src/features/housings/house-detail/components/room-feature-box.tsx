import { type ComponentProps } from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/src/theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

type Props = {
  label: string;
  icon: IconName;
  detail?: string;
  variant: "boolean" | "text";
};

export function RoomFeatureBox({ label, icon, detail, variant }: Props) {
  const { colors: c } = useAppTheme();
  const isBoolean = variant === "boolean";

  return (
    <View style={[styles.box, isBoolean ? styles.boxBoolean : styles.boxText, { borderColor: c.border }]}>
      {isBoolean ? (
        <>
          <Ionicons name={icon} size={16} color={c.primary} />
          <ThemedText style={[styles.label, styles.labelCentered, { color: c.title }]} numberOfLines={2}>
            {label}
          </ThemedText>
        </>
      ) : (
        <View style={styles.textRow}>
          <Ionicons name={icon} size={16} color={c.primary} />
          <View style={styles.textCol}>
            <ThemedText style={[styles.label, { color: c.hint }]} numberOfLines={1}>
              {label}
            </ThemedText>
            {detail ? (
              <ThemedText style={[styles.detail, { color: c.title }]} numberOfLines={2}>
                {detail}
              </ThemedText>
            ) : null}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 4,
  },
  boxBoolean: {
    width: "48%",
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  boxText: {
    width: "100%",
    minHeight: 40,
    justifyContent: "center",
  },
  textRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  textCol: { flex: 1, gap: 2 },
  label: { fontSize: 11, fontWeight: "600", lineHeight: 14 },
  labelCentered: { textAlign: "center" },
  detail: { fontSize: 10, lineHeight: 13, fontWeight: "600" },
});
