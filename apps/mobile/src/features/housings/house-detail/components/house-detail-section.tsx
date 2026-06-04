import { type ReactNode, useCallback, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { useHouseDetailScroll } from "@/src/features/housings/house-detail/house-detail-scroll-context";
import { useAppTheme } from "@/src/theme";

type Props = {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  count?: number;
};

export function HouseDetailSection({
  title,
  children,
  defaultExpanded = false,
  count,
}: Props) {
  const { colors: c } = useAppTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const sectionRef = useRef<View>(null);
  const scrollAfterExpandRef = useRef(false);
  const { scrollToSection } = useHouseDetailScroll();

  const scrollIntoView = useCallback(() => {
    requestAnimationFrame(() => {
      scrollToSection(sectionRef);
    });
  }, [scrollToSection]);

  const toggle = () => {
    setExpanded((prev) => {
      const next = !prev;
      if (next) {
        scrollAfterExpandRef.current = true;
        scrollIntoView();
      }
      return next;
    });
  };

  const handleBodyLayout = () => {
    if (!scrollAfterExpandRef.current) return;
    scrollAfterExpandRef.current = false;
    scrollIntoView();
  };

  return (
    <View
      ref={sectionRef}
      collapsable={false}
      style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}
    >
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <ThemedText style={[styles.title, { color: c.title }]}>{title}</ThemedText>
        <View style={styles.headerRight}>
          {count != null ? (
            <ThemedText style={[styles.count, { color: c.hint }]}>({count})</ThemedText>
          ) : null}
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={c.hint} />
        </View>
      </Pressable>
      {expanded ? (
        <View style={styles.body} onLayout={handleBodyLayout}>
          {children}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  headerPressed: { opacity: 0.85 },
  title: { flex: 1, fontSize: 16, fontWeight: "800" },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  count: {
    fontSize: 14,
    fontWeight: "600",
    minWidth: 16,
    textAlign: "right",
  },
  body: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
});
