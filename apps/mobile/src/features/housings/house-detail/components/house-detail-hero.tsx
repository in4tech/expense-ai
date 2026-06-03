import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { formatVndPrice } from "@/src/features/housings/house-detail/utils";
import type { HousingDetail } from "@/src/features/housings/types";
import type { Dictionary } from "@/src/i18n";
import { useAppTheme } from "@/src/theme";

type Props = {
  housing: HousingDetail;
  labels: Dictionary["houseDetail"];
  homeLabels: Dictionary["home"];
};

export function HouseDetailHero({ housing, labels: d, homeLabels }: Props) {
  const { colors: c } = useAppTheme();
  return (
    <View style={[styles.hero, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={[styles.media, { backgroundColor: c.cardMuted }]}>
        <View style={styles.mediaTopRow}>
          <View style={[styles.circleBtn, { backgroundColor: c.card }]}>
            <Ionicons name="image-outline" size={14} color={c.hint} />
          </View>
          <View style={[styles.circleBtn, { backgroundColor: c.card }]}>
            <Ionicons name="heart-outline" size={14} color={c.danger} />
          </View>
        </View>
        <View style={[styles.priceTag, { backgroundColor: c.card }]}>
          <ThemedText style={[styles.priceTagLabel, { color: c.hint }]}>{d.rentLabel}</ThemedText>
          <ThemedText style={[styles.priceTagValue, { color: c.primary }]}>
            {housing.price != null ? formatVndPrice(housing.price) : d.contactForPrice}
          </ThemedText>
        </View>
      </View>
      <View style={styles.textCol}>
        <ThemedText style={[styles.name, { color: c.title }]} numberOfLines={2}>
          {housing.house_name ?? homeLabels.untitledHousing}
        </ThemedText>
        <View style={styles.metaRow}>
          <Ionicons name="pricetag-outline" size={14} color={c.hint} />
          <ThemedText style={[styles.meta, { color: c.hint }]}>
            {homeLabels.roomCodeLabel}: {housing.room_code ?? d.unknown}
          </ThemedText>
        </View>
        <View style={[styles.addressRow, { borderTopColor: c.border }]}>
          <Ionicons name="location-outline" size={17} color={c.primary} />
          <ThemedText style={[styles.address, { color: c.text }]}>
            {housing.address ?? homeLabels.noAddress}
          </ThemedText>
        </View>
        <View style={styles.wifiRow}>
          <Ionicons
            name={housing.has_wifi ? "wifi" : "wifi-outline"}
            size={16}
            color={housing.has_wifi ? c.success : c.hint}
          />
          <ThemedText style={{ color: c.text, fontSize: 13 }}>
            {housing.has_wifi ? homeLabels.wifiAvailable : homeLabels.wifiUnknown}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  media: {
    height: 184,
    borderRadius: 18,
    padding: 10,
    justifyContent: "space-between",
  },
  mediaTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  circleBtn: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: { flex: 1, gap: 6 },
  name: { fontSize: 21, fontWeight: "800", lineHeight: 27 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  meta: { fontSize: 13 },
  priceTag: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 110,
    gap: 2,
    alignSelf: "flex-end",
  },
  priceTagLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  priceTagValue: { fontSize: 15, fontWeight: "800" },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  address: { flex: 1, fontSize: 14, lineHeight: 20 },
  wifiRow: { flexDirection: "row", alignItems: "center", gap: 8 },
});
