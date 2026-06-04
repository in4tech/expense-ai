import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/src/theme";

type NotificationsEmptyProps = {
  message: string;
};

export function NotificationsEmpty({ message }: NotificationsEmptyProps) {
  const { colors: c } = useAppTheme();

  return (
    <View style={styles.root}>
      <View style={[styles.iconWrap, { backgroundColor: c.chipBg }]}>
        <Ionicons name="notifications-off-outline" size={32} color={c.hint} />
      </View>
      <ThemedText style={[styles.text, { color: c.hint }]}>{message}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
