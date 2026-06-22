import { useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { StackIconButton } from "@/src/components/stack-icon-button";
import {
  HomeListEmpty,
  HomeListingSearchFilter,
  HomeListingsLoadingSkeleton,
  HomeListingsTabs,
  HousingListCard,
  HousingPopularCard,
  useHomeHousings,
  useHomeListingFilters,
} from "@/src/features/housings/home";
import { MOCK_RECOMMENDATION_HOUSINGS } from "@/src/features/housings/home/data/mock-recommendation-housings";
import {
  consumeHomeListingsSnapshot,
  type HomeListingsTab,
} from "@/src/features/housings/home/navigation/home-listings-bridge";
import { sortHousingsByPopularity } from "@/src/features/housings/home/utils/pick-popular-housings";
import { HouseDetailCenterState } from "@/src/features/housings/house-detail";
import type { Housing } from "@/src/features/housings/types";
import { useLanguage } from "@/src/i18n";
import { useAppTheme } from "@/src/theme";

export default function HomeListingsScreen() {
  const { dictionary } = useLanguage();
  const { colors: c } = useAppTheme();
  const home = dictionary.home;
  const contactForPrice = dictionary.houseDetail.contactForPrice;
  const { data, isLoading, isError, isFetching, error, refetch } = useHomeHousings();
  const [snapshot] = useState(() => consumeHomeListingsSnapshot());
  const [activeTab, setActiveTab] = useState<HomeListingsTab>(
    snapshot?.initialTab ?? "all",
  );
  const listingFilters = useHomeListingFilters(home);

  const apiHousings = useMemo(
    () => snapshot?.housings ?? data?.housings ?? [],
    [data?.housings, snapshot?.housings],
  );

  const filteredApiHousings = useMemo(
    () => listingFilters.applyToHousings(apiHousings),
    [apiHousings, listingFilters.applyToHousings],
  );

  const tabHousings = useMemo(() => {
    switch (activeTab) {
      case "popular":
        return sortHousingsByPopularity(filteredApiHousings);
      case "recommendation":
        return listingFilters.applyToHousings(MOCK_RECOMMENDATION_HOUSINGS);
      default:
        return filteredApiHousings;
    }
  }, [activeTab, filteredApiHousings, listingFilters.applyToHousings]);

  const listingTabs = useMemo(
    () =>
      [
        { id: "all" as const, label: home.listingsTabAll },
        { id: "popular" as const, label: home.popularTitle },
        { id: "recommendation" as const, label: home.recommendationTitle },
      ] satisfies { id: HomeListingsTab; label: string }[],
    [home.listingsTabAll, home.popularTitle, home.recommendationTitle],
  );

  const favoriteListingLabel = dictionary.houseDetail.favoriteListing;

  const renderItem = useCallback(
    ({ item }: { item: Housing }) => (
      <View style={styles.listItem}>
        {activeTab === "recommendation" ? (
          <HousingPopularCard
            housing={item}
            copy={home}
            contactForPrice={contactForPrice}
            layout="full"
            showSaveButton
            saveAccessibilityLabel={favoriteListingLabel}
          />
        ) : (
          <HousingListCard
            housing={item}
            copy={home}
            contactForPrice={contactForPrice}
            showSaveButton
            saveAccessibilityLabel={favoriteListingLabel}
          />
        )}
      </View>
    ),
    [activeTab, contactForPrice, favoriteListingLabel, home],
  );

  const keyExtractor = useCallback((item: Housing) => item.id, []);

  const onRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const errorMessage =
    error instanceof Error ? error.message : home.loadFailed;

  const needsApiData = activeTab !== "recommendation";
  const showLoading = needsApiData && isLoading && !snapshot;
  const showError = needsApiData && isError && !snapshot;
  const skeletonVariant = activeTab === "recommendation" ? "popular" : "list";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.screen }]} edges={["top"]}>
      <View style={styles.header}>
        <StackIconButton
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={home.viewAllBackA11y}
        >
          <Ionicons name="chevron-back" size={18} color={c.title} />
        </StackIconButton>
        <ThemedText style={[styles.headerTitle, { color: c.title }]} numberOfLines={1}>
          {home.title}
        </ThemedText>
      </View>

      <HomeListingSearchFilter
        labels={home}
        searchQuery={listingFilters.searchQuery}
        onSearchQueryChange={listingFilters.setSearchQuery}
        filters={listingFilters.filters}
        onFiltersChange={listingFilters.setFilters}
        filterSheetOpen={listingFilters.filterSheetOpen}
        onFilterSheetOpenChange={listingFilters.setFilterSheetOpen}
        activeFilterCount={listingFilters.activeFilterCount}
      />

      <HomeListingsTabs
        tabs={listingTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {showLoading ? (
        <HomeListingsLoadingSkeleton variant={skeletonVariant} />
      ) : showError ? (
        <HouseDetailCenterState
          variant="error"
          message={errorMessage}
          retryLabel={home.retry}
          onRetry={() => void refetch()}
        />
      ) : (
        <FlatList
          key={activeTab}
          style={styles.list}
          data={tabHousings}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            needsApiData ? (
              <RefreshControl
                refreshing={isFetching && !isLoading}
                onRefresh={onRefresh}
                tintColor={c.primary}
                colors={[c.primary]}
              />
            ) : undefined
          }
          ListEmptyComponent={<HomeListEmpty message={listingFilters.emptyMessage} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  list: { flex: 1 },
  listItem: {
    paddingHorizontal: 16,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 32,
    gap: 16,
  },
});
