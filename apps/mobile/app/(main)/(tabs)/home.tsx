import { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/src/features/auth";
import {
  HomeHeader,
  HomeListEmpty,
  HomeListingSearchFilter,
  HomePopularSection,
  HomeScreenLoadingSkeleton,
  useHomeHousings,
  useHomeListingFilters,
} from "@/src/features/housings/home";
import { MOCK_RECOMMENDATION_HOUSINGS } from "@/src/features/housings/home/data/mock-recommendation-housings";
import { setHomeListingsSnapshot } from "@/src/features/housings/home/navigation/home-listings-bridge";
import { getHomeGreeting } from "@/src/features/housings/home/utils/get-home-greeting";
import { pickPopularHousings } from "@/src/features/housings/home/utils/pick-popular-housings";
import { HouseDetailCenterState } from "@/src/features/housings/house-detail";
import { useNotificationReadState } from "@/src/features/notifications";
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

  const home = dictionary.home;
  const { hasUnread: hasUnreadNotifications } = useNotificationReadState(
    dictionary.notifications.mockItems,
  );
  const listingFilters = useHomeListingFilters(home);

  const housings = data?.housings ?? [];
  const filteredHousings = useMemo(
    () => listingFilters.applyToHousings(housings),
    [housings, listingFilters.applyToHousings],
  );
  const previewListings = useMemo(
    () => pickPopularHousings(filteredHousings),
    [filteredHousings],
  );
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
        notificationAccessibilityLabel={home.notificationsA11y}
        showNotificationBadge={hasUnreadNotifications}
        onNotificationPress={() => router.push(href.mainNotifications)}
        onPredictPress={() => router.push(href.mainHousingPredict)}
      />

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

      {isLoading ? (
        <HomeScreenLoadingSkeleton />
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
              titleIcon="heart"
              titleIconColor={c.danger}
              showSaveOnPopularCard
              saveAccessibilityLabel={dictionary.houseDetail.favoriteListing}
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
              titleIcon="flame"
              titleIconColor={c.primary}
            />
          ) : (
            <HomeListEmpty message={listingFilters.emptyMessage} />
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
