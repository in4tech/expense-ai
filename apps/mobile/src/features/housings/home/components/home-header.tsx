import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { href } from "@/src/navigation/href";
import { useAppTheme } from "@/src/theme";

type HomeHeaderProps = {
  title: string;
};

export function HomeHeader({ title }: HomeHeaderProps) {
  const { colors: c } = useAppTheme();

  return (
    <View style={styles.header}>
      <ThemedText style={[styles.title, { color: c.title }]}>{title}</ThemedText>
      <Pressable
        onPress={() => router.push(href.mainHousingPredict)}
        style={[styles.predictButton, { borderColor: c.border, backgroundColor: c.card }]}
        accessibilityRole="button">
        <Ionicons name="sparkles-outline" size={18} color={c.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 26, fontWeight: "700" },
  predictButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
