import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { OverviewStatCard } from "@/src/features/housings/house-detail/components/overview-stat-card";
import type { HousingDetail } from "@/src/features/housings/types";
import type { Dictionary } from "@/src/i18n";
import { useAppTheme } from "@/src/theme";

type Props = {
  housing: HousingDetail;
  description: string | null;
  labels: Dictionary["houseDetail"];
  homeLabels: Dictionary["home"];
};

export function HouseDetailOverviewSection({
  housing,
  description,
  labels: d,
  homeLabels,
}: Props) {
  const { colors: c } = useAppTheme();

  return (
    <>
      <View style={styles.statsGrid}>
        <OverviewStatCard
          icon="pricetag-outline"
          label={homeLabels.roomCodeLabel}
          value={housing.room_code ?? d.unknown}
        />
        <OverviewStatCard
          icon={housing.has_wifi ? "wifi" : "wifi-outline"}
          label={homeLabels.wifiAvailable}
          value={housing.has_wifi ? d.yes : d.no}
        />
        <OverviewStatCard
          icon="car-outline"
          label={d.meta.evCharging}
          value={housing.is_allow_electric_car ?? d.unknown}
        />
      </View>
      {description ? (
        <View style={[styles.descriptionBlock, { backgroundColor: c.cardMuted }]}>
          <ThemedText style={[styles.descriptionTitle, { color: c.title }]}>
            {d.descriptionLabel}
          </ThemedText>
          <ThemedText style={[styles.descriptionText, { color: c.text }]}>{description}</ThemedText>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: "row", gap: 8, marginBottom: 2 },
  descriptionBlock: { borderRadius: 12, padding: 12, gap: 8 },
  descriptionTitle: { fontSize: 13, fontWeight: "700" },
  descriptionText: { fontSize: 14, lineHeight: 22 },
});
