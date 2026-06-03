import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/src/theme";

type Props = {
  title: string;
};

export function HouseDetailHeader({ title }: Props) {
  const { colors: c } = useAppTheme();

  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => router.back()}
        style={[styles.iconBtn, { borderColor: c.border, backgroundColor: c.card }]}
      >
        <Ionicons name="chevron-back" size={20} color={c.title} />
      </Pressable>
      <ThemedText style={[styles.headerTitle, { color: c.title }]} numberOfLines={1}>
        {title}
      </ThemedText>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    marginHorizontal: 8,
  },
  spacer: { width: 40 },
});
