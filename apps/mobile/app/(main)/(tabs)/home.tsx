import { useCallback, useMemo, useState } from "react";
import { FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  HomeFilterSheet,
  HomeHeader,
  HomeListEmpty,
  HousingListCard,
  useHomeHousings,
  EMPTY_HOME_HOUSING_FILTERS,
  countActiveHomeFilters,
  type HomeHousingFilters,
} from "@/src/features/housings/home";
import { filterHousings } from "@/src/features/housings/home/utils/filter-housings";
import { HouseDetailCenterState } from "@/src/features/housings/house-detail";
import type { Housing } from "@/src/features/housings/types";
import { useLanguage } from "@/src/i18n";
import { useAppTheme } from "@/src/theme";

export default function HomeScreen() {
  const { dictionary } = useLanguage();
  const { colors: c } = useAppTheme();
  const { data, isLoading, isError, error, refetch } = useHomeHousings();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<HomeHousingFilters>(EMPTY_HOME_HOUSING_FILTERS);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const housings = data?.housings ?? [];
  const activeFilterCount = countActiveHomeFilters(filters);
  const filteredHousings = useMemo(
    () => filterHousings(housings, searchQuery, filters),
    [housings, searchQuery, filters],
  );
  const home = dictionary.home;

  const handleSearchToggle = useCallback(() => {
    setSearchOpen((open) => {
      if (open) {
        setSearchQuery("");
        setFilters(EMPTY_HOME_HOUSING_FILTERS);
        setFilterSheetOpen(false);
      }
      return !open;
    });
  }, []);

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
      <HomeHeader
        title={home.title}
        searchPlaceholder={home.searchPlaceholder}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        searchOpen={searchOpen}
        onSearchToggle={handleSearchToggle}
        hasActiveFilters={activeFilterCount > 0}
        onFilterPress={searchOpen ? () => setFilterSheetOpen(true) : undefined}
        filterAccessibilityLabel={home.filterTitle}
      />

      <HomeFilterSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        filters={filters}
        onChange={setFilters}
        labels={home}
      />

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
          data={filteredHousings}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <HomeListEmpty
              message={
                searchQuery.trim()
                  ? home.searchNoResults
                  : activeFilterCount > 0
                    ? home.filterNoResults
                    : home.empty
              }
            />
          }
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
