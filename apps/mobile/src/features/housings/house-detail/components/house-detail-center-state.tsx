import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/src/theme";

type LoadingProps = {
  variant: "loading";
  message: string;
};

type ErrorProps = {
  variant: "error";
  message: string;
  retryLabel: string;
  onRetry: () => void;
};

type Props = LoadingProps | ErrorProps;

export function HouseDetailCenterState(props: Props) {
  const { colors: c } = useAppTheme();

  if (props.variant === "loading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={c.primary} />
        <ThemedText style={[styles.text, { color: c.hint }]}>{props.message}</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Ionicons name="alert-circle-outline" size={28} color={c.danger} />
      <ThemedText style={[styles.text, { color: c.danger }]}>{props.message}</ThemedText>
      <Pressable
        onPress={props.onRetry}
        style={[styles.retryBtn, { borderColor: c.border, backgroundColor: c.card }]}
      >
        <ThemedText style={{ color: c.title, fontWeight: "600" }}>{props.retryLabel}</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  text: { fontSize: 15, textAlign: "center" },
  retryBtn: {
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
});
