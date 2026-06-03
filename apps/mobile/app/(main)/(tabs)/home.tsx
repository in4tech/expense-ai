import { useCallback } from "react";
import { FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  HomeHeader,
  HomeListEmpty,
  HousingListCard,
  useHomeHousings,
} from "@/src/features/housings/home";
import { HouseDetailCenterState } from "@/src/features/housings/house-detail";
import type { Housing } from "@/src/features/housings/types";
import { useLanguage } from "@/src/i18n";
import { useAppTheme } from "@/src/theme";

export default function HomeScreen() {
  const { dictionary } = useLanguage();
  const { colors: c } = useAppTheme();
  const { data, isLoading, isError, error, refetch } = useHomeHousings();

  const housings = data?.housings ?? [];
  const home = dictionary.home;

  const renderItem = useCallback(
    ({ item }: { item: Housing }) => (
      <HousingListCard
        housing={item}
        copy={home}
        contactForPrice={dictionary.houseDetail.contactForPrice}
      />
    ),
    [dictionary.houseDetail.contactForPrice, home],
  );

  const keyExtractor = useCallback((item: Housing) => item.id, []);

  const errorMessage =
    error instanceof Error ? error.message : home.loadFailed;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.screen }]} edges={["top"]}>
      <HomeHeader title={home.title} />

      {isLoading ? (
        <HouseDetailCenterState variant="loading" message={home.loading} />
      ) : isError ? (
        <HouseDetailCenterState
          variant="error"
          message={errorMessage}
          retryLabel={home.retry}
          onRetry={() => void refetch()}
        />
      ) : (
        <FlatList
          data={housings}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<HomeListEmpty message={home.empty} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
});
