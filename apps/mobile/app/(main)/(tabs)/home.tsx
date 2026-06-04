import { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/src/features/auth";
import {
  HomeFilterSheet,
  HomeHeader,
  HomeListEmpty,
  HomePopularSection,
  useHomeHousings,
  EMPTY_HOME_HOUSING_FILTERS,
  countActiveHomeFilters,
  type HomeHousingFilters,
} from "@/src/features/housings/home";
import { MOCK_RECOMMENDATION_HOUSINGS } from "@/src/features/housings/home/data/mock-recommendation-housings";
import { setHomeListingsSnapshot } from "@/src/features/housings/home/navigation/home-listings-bridge";
import { getHomeGreeting } from "@/src/features/housings/home/utils/get-home-greeting";
import { filterHousings } from "@/src/features/housings/home/utils/filter-housings";
import { pickPopularHousings } from "@/src/features/housings/home/utils/pick-popular-housings";
import { HouseDetailCenterState } from "@/src/features/housings/house-detail";
import { getDefaultAvatarUri, loadProfile } from "@/src/features/profile";
import { useLanguage } from "@/src/i18n";
import { href } from "@/src/navigation/href";
import { useAppTheme } from "@/src/theme";

export default function HomeScreen() {
  const { dictionary } = useLanguage();
  const { colors: c } = useAppTheme();
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useHomeHousings();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<HomeHousingFilters>(
    EMPTY_HOME_HOUSING_FILTERS,
  );
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const housings = data?.housings ?? [];
  const activeFilterCount = countActiveHomeFilters(filters);
  const filteredHousings = useMemo(
    () => filterHousings(housings, searchQuery, filters),
    [housings, searchQuery, filters],
  );
  const previewListings = useMemo(
    () => pickPopularHousings(filteredHousings),
    [filteredHousings],
  );
  const home = dictionary.home;
  const greeting = useMemo(() => getHomeGreeting(home), [home]);
  const userName = useMemo(() => {
    const trimmed = profileName.trim();
    if (trimmed) {
      return trimmed;
    }
    const emailPrefix = user?.email?.split("@")[0]?.trim();
    if (emailPrefix) {
      return emailPrefix;
    }
    return home.guestName;
  }, [home.guestName, profileName, user?.email]);

  const displayAvatarUri = useMemo(() => {
    if (avatarUri) {
      return avatarUri;
    }
    const seed = user?.id ?? user?.email ?? userName;
    return getDefaultAvatarUri(seed, 96);
  }, [avatarUri, user?.email, user?.id, userName]);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) {
        setAvatarUri(null);
        setProfileName("");
        return;
      }
      let cancelled = false;
      void loadProfile(user.id).then((profile) => {
        if (cancelled) {
          return;
        }
        setAvatarUri(profile.avatarUri);
        setProfileName(profile.username);
      });
      return () => {
        cancelled = true;
      };
    }, [user?.id]),
  );

  const contactForPrice = dictionary.houseDetail.contactForPrice;

  const openAllListings = useCallback(() => {
    setHomeListingsSnapshot({
      housings: filteredHousings,
      initialTab: "popular",
    });
    router.push(href.mainHomeListings);
  }, [filteredHousings]);

  const emptyMessage = searchQuery.trim()
    ? home.searchNoResults
    : activeFilterCount > 0
      ? home.filterNoResults
      : home.empty;

  const errorMessage = error instanceof Error ? error.message : home.loadFailed;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: c.screen }]}
      edges={["top"]}
    >
      <HomeHeader
        greeting={greeting}
        userName={userName}
        avatarUri={displayAvatarUri}
        searchPlaceholder={home.searchPlaceholder}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onProfilePress={() => router.push(href.mainProfile)}
        onPredictPress={() => router.push(href.mainHousingPredict)}
        hasActiveFilters={activeFilterCount > 0}
        onFilterPress={() => setFilterSheetOpen(true)}
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
        <View style={styles.sections}>
          {!isError ? (
            <HomePopularSection
              title={home.recommendationTitle}
              housings={MOCK_RECOMMENDATION_HOUSINGS}
              copy={home}
              contactForPrice={contactForPrice}
              listKeyPrefix="recommendation"
            />
          ) : null}

          {previewListings.length > 0 ? (
            <HomePopularSection
              title={home.allListingsTitle}
              housings={previewListings}
              copy={home}
              contactForPrice={contactForPrice}
              cardVariant="listing"
              viewAllLabel={home.viewAll}
              onViewAllPress={openAllListings}
              listKeyPrefix="listing"
            />
          ) : (
            <HomeListEmpty message={emptyMessage} />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  sections: {
    paddingTop: 12,
    paddingBottom: 24,
    gap: 28,
  },
});
