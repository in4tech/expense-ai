import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { HomeListingsTab } from "@/src/features/housings/home/navigation/home-listings-bridge";
import { useAppTheme } from "@/src/theme";

type TabOption = {
  id: HomeListingsTab;
  label: string;
};

type Props = {
  tabs: TabOption[];
  activeTab: HomeListingsTab;
  onTabChange: (tab: HomeListingsTab) => void;
};

export function HomeListingsTabs({ tabs, activeTab, onTabChange }: Props) {
  const { colors: c } = useAppTheme();

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {tabs.map((tab) => {
          const selected = tab.id === activeTab;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={[
                styles.tab,
                {
                  backgroundColor: selected ? c.primary : c.chipOff,
                  borderColor: selected ? c.primary : c.border,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.tabLabel,
                  { color: selected ? "#FFFFFF" : c.chipTextOff },
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
});
