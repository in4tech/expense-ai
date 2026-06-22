import { ScrollView, StyleSheet } from "react-native";

import { HomePopularSectionSkeleton } from "./home-popular-section-skeleton";

export function HomeScreenLoadingSkeleton() {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.sections}
      showsVerticalScrollIndicator={false}
    >
      <HomePopularSectionSkeleton cardVariant="popular" />
      <HomePopularSectionSkeleton cardVariant="listing" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  sections: {
    paddingTop: 12,
    paddingBottom: 24,
    gap: 28,
  },
});
