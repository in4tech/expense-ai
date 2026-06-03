import { useCallback, useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { HomeFeeCell } from "@/src/features/housings/home/components/home-fee-cell";
import { HOME_FEE_ROWS } from "@/src/features/housings/home/constants";
import { formatListingFee, formatListingPrice } from "@/src/features/housings/house-detail/utils";
import type { Housing } from "@/src/features/housings/types";
import type { Dictionary } from "@/src/i18n";
import { href } from "@/src/navigation/href";
import { useAppTheme } from "@/src/theme";

type HomeCopy = Dictionary["home"];

type HousingListCardProps = {
  housing: Housing;
  copy: HomeCopy;
  contactForPrice: string;
};

export function HousingListCard({ housing, copy, contactForPrice }: HousingListCardProps) {
  const { colors: c } = useAppTheme();

  const displayName = housing.house_name ?? copy.untitledHousing;
  const displayAddress = housing.address ?? copy.noAddress;
  const displayPrice = formatListingPrice(housing.price, contactForPrice);

  const onViewDetails = useCallback(() => {
    router.push(href.mainHouseDetail(housing.id));
  }, [housing.id]);

  const feeRows = useMemo(
    () =>
      HOME_FEE_ROWS.map((row) => ({
        key: row.feeKey,
        icon: row.icon,
        label: copy[row.labelKey],
        unit: housing[row.unitKey],
        value: formatListingFee(housing[row.feeKey]),
      })),
    [copy, housing],
  );

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.titleWrap}>
          <ThemedText style={[styles.houseName, { color: c.title }]} numberOfLines={1}>
            {displayName}
          </ThemedText>
          <ThemedText style={[styles.roomCode, { color: c.hint }]}>
            {copy.roomCodeLabel}: {housing.room_code ?? "—"}
          </ThemedText>
        </View>
        <View style={[styles.priceChip, { backgroundColor: c.chipBg }]}>
          <ThemedText style={[styles.priceChipText, { color: c.primary }]}>{displayPrice}</ThemedText>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="location-outline" size={16} color={c.hint} />
        <ThemedText style={[styles.infoText, { color: c.text }]} numberOfLines={2}>
          {displayAddress}
        </ThemedText>
      </View>

      <View style={styles.feeGrid}>
        {feeRows.map((row) => (
          <HomeFeeCell
            key={row.key}
            icon={row.icon}
            label={row.label}
            unit={row.unit}
            value={row.value}
          />
        ))}
      </View>

      <View style={styles.footerRow}>
        <View style={styles.footerItem}>
          <Ionicons
            name={housing.has_wifi ? "wifi" : "wifi-outline"}
            size={15}
            color={housing.has_wifi ? c.success : c.hint}
          />
          <ThemedText style={[styles.footerText, { color: c.text }]}>
            {housing.has_wifi ? copy.wifiAvailable : copy.wifiUnknown}
          </ThemedText>
        </View>
        <Pressable onPress={onViewDetails} style={styles.detailsPressable} hitSlop={8}>
          <ThemedText style={[styles.detailsText, { color: c.primary }]}>{copy.viewDetails}</ThemedText>
          <Ionicons name="chevron-forward" size={14} color={c.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 10,
  },
  titleWrap: { flex: 1, gap: 3 },
  houseName: { fontSize: 17, fontWeight: "700" },
  roomCode: { fontSize: 12, fontWeight: "500" },
  priceChip: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  priceChipText: { fontWeight: "700", fontSize: 12 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 10 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  feeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  footerText: { fontSize: 12 },
  detailsPressable: { flexDirection: "row", alignItems: "center", gap: 2 },
  detailsText: { fontSize: 13, fontWeight: "700" },
});
