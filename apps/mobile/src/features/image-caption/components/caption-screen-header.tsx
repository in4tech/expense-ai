import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { CaptionModeBadge } from "@/src/features/image-caption/components/caption-mode-badge";

type CaptionScreenHeaderProps = {
  eyebrow: string;
  title?: string;
  subtitle?: string;
  mode: "camera" | "gallery";
  modeLabel: string;
};

export function CaptionScreenHeader({
  eyebrow,
  title,
  subtitle,
  mode,
  modeLabel,
}: CaptionScreenHeaderProps) {
  return (
    <View style={styles.shell}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <ThemedText style={styles.eyebrow}>{eyebrow}</ThemedText>
          {title ? <ThemedText style={styles.title}>{title}</ThemedText> : null}
          {subtitle ? <ThemedText style={styles.subtitle}>{subtitle}</ThemedText> : null}
        </View>
        <CaptionModeBadge mode={mode} label={modeLabel} />
      </View>
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  copy: {
    flex: 1,
    gap: 2,
    paddingTop: 2,
  },
  eyebrow: {
    color: "rgba(134, 239, 172, 0.9)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 2,
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 2,
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
});
