import { useMemo, useRef } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { housingDetailQueryOptions, type HousingDetail, type RoomDetail } from "@/src/features/housings";
import {
  formatAmenitiesDescription,
  getHousingCoords,
  HouseDetailCenterState,
  HouseDetailHeader,
  HouseDetailHero,
  HouseDetailLocationMap,
  HouseDetailOverviewSection,
  HouseDetailPropertySection,
  HouseDetailRoomSection,
  HouseDetailScrollProvider,
  HouseDetailSection,
} from "@/src/features/housings/house-detail";
import { useHouseDetailScroll } from "@/src/features/housings/house-detail/house-detail-scroll-context";
import { useAuth } from "@/src/providers/auth-context";
import { useLanguage, type Dictionary } from "@/src/i18n";
import { useAppTheme } from "@/src/theme";

type ScrollBodyProps = {
  housing: HousingDetail;
  room: RoomDetail | null;
  housingCoords: { latitude: number; longitude: number } | null;
  amenitiesDescription: string | null;
  labels: Dictionary["houseDetail"];
  homeLabels: Dictionary["home"];
  mapWebFallback: string;
};

function HouseDetailScrollBody({
  housing,
  room,
  housingCoords,
  amenitiesDescription,
  labels: d,
  homeLabels,
  mapWebFallback,
}: ScrollBodyProps) {
  const { contentRef } = useHouseDetailScroll();

  return (
    <View ref={contentRef} collapsable={false} style={styles.scrollContent}>
      <HouseDetailHero housing={housing} labels={d} homeLabels={homeLabels} />

      {housingCoords ? (
        <HouseDetailSection title={d.sectionLocation}>
          <HouseDetailLocationMap
            latitude={housingCoords.latitude}
            longitude={housingCoords.longitude}
            address={housing.address}
            openInMapsLabel={d.openInMaps}
            webFallback={mapWebFallback}
          />
        </HouseDetailSection>
      ) : null}

      <HouseDetailSection title={d.sectionOverview}>
        <HouseDetailOverviewSection
          housing={housing}
          description={amenitiesDescription}
          labels={d}
          homeLabels={homeLabels}
        />
      </HouseDetailSection>

      <HouseDetailSection title={d.sectionProperty}>
        <HouseDetailPropertySection housing={housing} labels={d} homeLabels={homeLabels} />
      </HouseDetailSection>

      <HouseDetailSection title={d.sectionRoom}>
        <HouseDetailRoomSection room={room} labels={d} />
      </HouseDetailSection>
    </View>
  );
}

export default function HouseDetailScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : "";
  const { getApiClient } = useAuth();
  const { dictionary } = useLanguage();
  const d = dictionary.houseDetail;
  const homeDict = dictionary.home;
  const { colors } = useAppTheme();
  const scrollRef = useRef<ScrollView>(null);

  const client = useMemo(() => getApiClient(), [getApiClient]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    ...housingDetailQueryOptions(client, id),
  });

  const housing = data?.housing;
  const room = data?.room ?? null;

  const housingCoords = useMemo(() => getHousingCoords(housing), [housing]);
  const amenitiesDescription = useMemo(
    () => formatAmenitiesDescription(housing?.amenities),
    [housing?.amenities],
  );

  if (!id) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.screen }]} edges={["top"]}>
        <HouseDetailHeader title={d.title} />
        <View style={styles.centerState}>
          <ThemedText style={[styles.stateText, { color: colors.hint }]}>{d.loadFailed}</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.screen }]} edges={["top"]}>
      <HouseDetailHeader title={d.title} />

      {isLoading ? (
        <HouseDetailCenterState variant="loading" message={d.loading} />
      ) : isError || !housing ? (
        <HouseDetailCenterState
          variant="error"
          message={error instanceof Error ? error.message : d.loadFailed}
          retryLabel={d.retry}
          onRetry={() => void refetch()}
        />
      ) : (
        <HouseDetailScrollProvider scrollRef={scrollRef}>
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <HouseDetailScrollBody
              housing={housing}
              room={room}
              housingCoords={housingCoords}
              amenitiesDescription={amenitiesDescription}
              labels={d}
              homeLabels={homeDict}
              mapWebFallback={dictionary.mapPickLocation.webFallback}
            />
          </ScrollView>
        </HouseDetailScrollProvider>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  stateText: { fontSize: 15, textAlign: "center" },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 16,
  },
});
