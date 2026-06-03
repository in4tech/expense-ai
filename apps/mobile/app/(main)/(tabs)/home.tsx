import { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/src/providers/auth-context";
import { housingsListQueryOptions, type Housing } from "@/src/features/housings";
import { useLanguage } from "@/src/i18n";
import { href } from "@/src/navigation/href";
import { useAppTheme } from "@/src/theme";

const VND = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const feeText = (fee: number | null) => {
  if (fee == null) return "—";
  if (fee <= 0) return "Free";
  return VND.format(fee);
};

const priceText = (price: number | null) => {
  if (price == null) return "Liên hệ";
  return VND.format(price);
};

export default function HomeScreen() {
  const { getApiClient } = useAuth();
  const { dictionary } = useLanguage();
  const { colors: c } = useAppTheme();
  const client = useMemo(() => getApiClient(), [getApiClient]);

  const { data, isLoading, isRefetching, isError, error, refetch } = useQuery(
    housingsListQueryOptions(client, 60, 0),
  );

  const housings = data?.housings ?? [];

  const renderItem = ({ item }: { item: Housing }) => {
    return (
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.titleWrap}>
            <ThemedText style={[styles.houseName, { color: c.title }]} numberOfLines={1}>
              {item.house_name ?? dictionary.home.untitledHousing}
            </ThemedText>
            <ThemedText style={[styles.roomCode, { color: c.hint }]}>
              {dictionary.home.roomCodeLabel}: {item.room_code ?? "—"}
            </ThemedText>
          </View>
          <View style={[styles.priceChip, { backgroundColor: c.chipBg }]}>
            <ThemedText style={[styles.priceChipText, { color: c.primary }]}>
              {priceText(item.price)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={c.hint} />
          <ThemedText style={[styles.infoText, { color: c.text }]} numberOfLines={2}>
            {item.address ?? dictionary.home.noAddress}
          </ThemedText>
        </View>

        <View style={styles.feeGrid}>
          <FeeCell label={dictionary.home.electricityFee} value={feeText(item.electricity_fee)} color={c.text} />
          <FeeCell label={dictionary.home.waterFee} value={feeText(item.water_fee)} color={c.text} />
          <FeeCell label={dictionary.home.parkingFee} value={feeText(item.parking_fee)} color={c.text} />
          <FeeCell label={dictionary.home.garbageFee} value={feeText(item.garbage_fee)} color={c.text} />
        </View>

        <View style={styles.footerRow}>
          <View style={styles.footerItem}>
            <Ionicons
              name={item.has_wifi ? "wifi" : "wifi-outline"}
              size={15}
              color={item.has_wifi ? c.success : c.hint}
            />
            <ThemedText style={[styles.footerText, { color: c.text }]}>
              {item.has_wifi ? dictionary.home.wifiAvailable : dictionary.home.wifiUnknown}
            </ThemedText>
          </View>
          <Pressable
            onPress={() => router.push(href.mainHouseDetail(item.id))}
            style={styles.detailsPressable}
            hitSlop={8}
          >
            <ThemedText style={[styles.detailsText, { color: c.primary }]}>
              {dictionary.home.viewDetails}
            </ThemedText>
            <Ionicons name="chevron-forward" size={14} color={c.primary} />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.screen }]} edges={["top"]}>
      <View style={styles.header}>
        <ThemedText style={[styles.headerTitle, { color: c.title }]}>
          {dictionary.home.title}
        </ThemedText>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push(href.mainHousingPredict)}
            style={[styles.iconButton, { borderColor: c.border, backgroundColor: c.card }]}
          >
            <Ionicons name="sparkles-outline" size={18} color={c.primary} />
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={c.primary} />
          <ThemedText style={[styles.stateText, { color: c.hint }]}>
            {dictionary.home.loading}
          </ThemedText>
        </View>
      ) : isError ? (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={22} color={c.danger} />
          <ThemedText style={[styles.stateText, { color: c.danger }]}>
            {error instanceof Error ? error.message : dictionary.home.loadFailed}
          </ThemedText>
          <Pressable onPress={() => void refetch()} style={[styles.retryBtn, { borderColor: c.border }]}>
            <ThemedText style={{ color: c.title }}>{dictionary.home.retry}</ThemedText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={housings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerState}>
              <ThemedText style={[styles.stateText, { color: c.hint }]}>
                {dictionary.home.empty}
              </ThemedText>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function FeeCell({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  const isFree = value === "Free";

  return (
    <View style={styles.feeCell}>
      <ThemedText style={[styles.feeLabel, { color }]}>{label}</ThemedText>
      <ThemedText style={[styles.feeValue, { color }, isFree && styles.feeValueFree]} numberOfLines={1}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 26, fontWeight: "700" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  predictHintWrap: { paddingHorizontal: 16, paddingBottom: 8 },
  predictHintText: { fontSize: 12, fontWeight: "500" },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
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
  feeCell: {
    width: "48%",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "rgba(148,163,184,0.08)",
  },
  feeLabel: { fontSize: 11, opacity: 0.8, marginBottom: 2 },
  feeValue: { fontSize: 12, fontWeight: "600" },
  feeValueFree: { fontWeight: "800" },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  footerText: { fontSize: 12 },
  footerHint: { fontSize: 11, fontWeight: "500" },
  detailsPressable: { flexDirection: "row", alignItems: "center", gap: 2 },
  detailsText: { fontSize: 13, fontWeight: "700" },
  centerState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 16 },
  stateText: { fontSize: 14, textAlign: "center" },
  retryBtn: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
});
