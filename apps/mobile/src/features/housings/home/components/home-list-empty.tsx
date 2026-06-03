import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/src/theme";

type HomeListEmptyProps = {
  message: string;
};

export function HomeListEmpty({ message }: HomeListEmptyProps) {
  const { colors: c } = useAppTheme();

  return (
    <View style={styles.root}>
      <ThemedText style={[styles.text, { color: c.hint }]}>{message}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  text: { fontSize: 14, textAlign: "center" },
});
