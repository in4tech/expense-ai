import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { CaptionModeBadge } from "@/src/features/image-caption/components/caption-mode-badge";

type CaptionScreenHeaderProps = {
  eyebrow: string;
  title: string;
  mode: "camera" | "gallery";
  modeLabel: string;
};

export function CaptionScreenHeader({
  eyebrow,
  title,
  mode,
  modeLabel,
}: CaptionScreenHeaderProps) {
  return (
    <View style={styles.shell}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <ThemedText style={styles.eyebrow}>{eyebrow}</ThemedText>
          <ThemedText style={styles.title}>{title}</ThemedText>
        </View>
        <CaptionModeBadge mode={mode} label={modeLabel} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    color: "rgba(134, 239, 172, 0.88)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
  },
});
