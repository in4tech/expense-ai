import { useMemo, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/src/providers/auth-context";
import { housingDetailQueryOptions, type RoomDetail } from "@/src/features/housings";
import { useLanguage } from "@/src/i18n";

const VND = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const feeText = (fee: number | null) => {
  if (fee == null) return "—";
  return VND.format(fee);
};

const BOOL_KEYS = [
  "kitchen",
  "desk",
  "bed",
  "elevator",
  "tivi",
  "mattress",
  "pet",
  "bancony",
  "fridge",
  "washer",
  "hotwater",
  "air_conditioner",
  "kitchent_sink",
  "window",
  "wardrobe",
  "skylight",
  "attic",
] as const;

type BoolKey = (typeof BOOL_KEYS)[number];

const STRING_KEYS = [
  "cooling_type",
  "parking_space",
  "toilet",
  "time",
  "gatelock",
  "room_area",
  "drying_yard",
  "floor",
] as const;

type StringKey = (typeof STRING_KEYS)[number];

function boolLabel(
  value: boolean | null,
  yes: string,
  no: string,
  unknown: string,
): string {
  if (value === true) return yes;
  if (value === false) return no;
  return unknown;
}

export default function HouseDetailScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : "";
  const { getApiClient } = useAuth();
  const { dictionary } = useLanguage();
  const d = dictionary.houseDetail;
  const { home: homeDict } = dictionary;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const client = useMemo(() => getApiClient(), [getApiClient]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    ...housingDetailQueryOptions(client, id),
  });

  const c = {
    screen: isDark ? "#0B0B0F" : "#F0F4FA",
    card: isDark ? "#17181D" : "#FFFFFF",
    cardMuted: isDark ? "#1C1E24" : "#F8FAFC",
    title: isDark ? "#F3F4F6" : "#0F172A",
    text: isDark ? "#CBD5E1" : "#475569",
    hint: isDark ? "#94A3B8" : "#64748B",
    primary: "#4F46E5",
    border: isDark ? "#2B2D33" : "#E2E8F0",
    success: isDark ? "#86EFAC" : "#16A34A",
    danger: isDark ? "#FCA5A5" : "#DC2626",
    chipOn: isDark ? "rgba(34,197,94,0.2)" : "#DCFCE7",
    chipOff: isDark ? "rgba(148,163,184,0.12)" : "#F1F5F9",
    chipTextOn: isDark ? "#86EFAC" : "#166534",
    chipTextOff: isDark ? "#94A3B8" : "#64748B",
  };

  const housing = data?.housing;
  const room = data?.room ?? null;

  const amenitiesText = useMemo(() => {
    const raw = housing?.amenities;
    if (raw == null) return null;
    try {
      return typeof raw === "string" ? raw : JSON.stringify(raw, null, 2);
    } catch {
      return String(raw);
    }
  }, [housing?.amenities]);

  if (!id) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.screen }]} edges={["top"]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.iconBtn, { borderColor: c.border, backgroundColor: c.card }]}
          >
            <Ionicons name="chevron-back" size={20} color={c.title} />
          </Pressable>
          <ThemedText style={[styles.headerTitle, { color: c.title }]} numberOfLines={1}>
            {d.title}
          </ThemedText>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerState}>
          <ThemedText style={[styles.stateText, { color: c.hint }]}>{d.loadFailed}</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.screen }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconBtn, { borderColor: c.border, backgroundColor: c.card }]}
        >
          <Ionicons name="chevron-back" size={20} color={c.title} />
        </Pressable>
        <ThemedText style={[styles.headerTitle, { color: c.title }]} numberOfLines={1}>
          {d.title}
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={c.primary} />
          <ThemedText style={[styles.stateText, { color: c.hint }]}>{d.loading}</ThemedText>
        </View>
      ) : isError || !housing ? (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={28} color={c.danger} />
          <ThemedText style={[styles.stateText, { color: c.danger }]}>
            {error instanceof Error ? error.message : d.loadFailed}
          </ThemedText>
          <Pressable
            onPress={() => void refetch()}
            style={[styles.retryBtn, { borderColor: c.border, backgroundColor: c.card }]}
          >
            <ThemedText style={{ color: c.title, fontWeight: "600" }}>{d.retry}</ThemedText>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.hero, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.heroTop}>
              <View style={styles.heroTextCol}>
                <ThemedText style={[styles.heroName, { color: c.title }]} numberOfLines={2}>
                  {housing.house_name ?? homeDict.untitledHousing}
                </ThemedText>
                <View style={styles.heroMetaRow}>
                  <Ionicons name="pricetag-outline" size={14} color={c.hint} />
                  <ThemedText style={[styles.heroMeta, { color: c.hint }]}>
                    {homeDict.roomCodeLabel}: {housing.room_code ?? d.unknown}
                  </ThemedText>
                </View>
              </View>
              <View style={[styles.priceTag, { backgroundColor: c.chipOn }]}>
                <ThemedText style={[styles.priceTagLabel, { color: c.chipTextOn }]}>
                  {d.rentLabel}
                </ThemedText>
                <ThemedText style={[styles.priceTagValue, { color: c.primary }]}>
                  {housing.price != null ? VND.format(housing.price) : d.contactForPrice}
                </ThemedText>
              </View>
            </View>
            <View style={[styles.mapRow, { borderTopColor: c.border }]}>
              <Ionicons name="location-outline" size={18} color={c.primary} />
              <ThemedText style={[styles.addressText, { color: c.text }]}>
                {housing.address ?? homeDict.noAddress}
              </ThemedText>
            </View>
            <View style={styles.wifiRow}>
              <Ionicons
                name={housing.has_wifi ? "wifi" : "wifi-outline"}
                size={18}
                color={housing.has_wifi ? c.success : c.hint}
              />
              <ThemedText style={{ color: c.text, fontSize: 14 }}>
                {housing.has_wifi ? homeDict.wifiAvailable : homeDict.wifiUnknown}
              </ThemedText>
            </View>
          </View>

          <Section title={d.sectionOverview} c={c}>
            {amenitiesText ? (
              <View style={[styles.amenitiesBox, { backgroundColor: c.cardMuted }]}>
                <ThemedText style={[styles.amenitiesMono, { color: c.text }]}>{amenitiesText}</ThemedText>
              </View>
            ) : null}
            <MetaRow label={d.meta.roomLink} value={housing.room_id ?? d.unknown} c={c} />
            <MetaRow label={d.meta.lastUpdate} value={housing.last_update ?? d.unknown} c={c} />
            <MetaRow label={d.meta.createdAt} value={housing.created_at ?? d.unknown} c={c} />
            <MetaRow label={d.meta.updatedAt} value={housing.updated_at ?? d.unknown} c={c} />
          </Section>

          <Section title={d.sectionProperty} c={c}>
            <View style={styles.feeGrid}>
              <FeeChip label={homeDict.electricityFee} value={feeText(housing.electricity_fee)} c={c} />
              <FeeChip label={homeDict.waterFee} value={feeText(housing.water_fee)} c={c} />
              <FeeChip label={homeDict.parkingFee} value={feeText(housing.parking_fee)} c={c} />
              <FeeChip label={homeDict.garbageFee} value={feeText(housing.garbage_fee)} c={c} />
              <FeeChip label={d.meta.cardFee} value={feeText(housing.card_fee)} c={c} />
              <FeeChip label={d.meta.washingFee} value={feeText(housing.washing_machine_fee)} c={c} />
              <FeeChip label={d.meta.otherFee} value={feeText(housing.otherfee)} c={c} />
            </View>
            <MetaRow label={d.meta.electricityUnit} value={housing.electricity_unit ?? d.unknown} c={c} />
            <MetaRow label={d.meta.waterUnit} value={housing.water_unit ?? d.unknown} c={c} />
            <MetaRow label={d.meta.parkingUnit} value={housing.parking_unit ?? d.unknown} c={c} />
            <MetaRow label={d.meta.cardUnit} value={housing.card_unit ?? d.unknown} c={c} />
            <MetaRow label={d.meta.garbageUnit} value={housing.garbage_unit ?? d.unknown} c={c} />
            <MetaRow label={d.meta.evCharging} value={housing.is_allow_electric_car ?? d.unknown} c={c} />
          </Section>

          <Section title={d.sectionRoom} c={c}>
            {!room ? (
              <ThemedText style={[styles.noRoom, { color: c.hint }]}>{d.noRoom}</ThemedText>
            ) : (
              <>
                <View style={styles.chipsWrap}>
                  {BOOL_KEYS.map((key) => (
                    <AmenityChip
                      key={key}
                      label={d.roomBool[key as BoolKey]}
                      value={room[key as keyof RoomDetail] as boolean | null}
                      yes={d.yes}
                      no={d.no}
                      unknown={d.unknown}
                      c={c}
                    />
                  ))}
                </View>
                {STRING_KEYS.map((key) => {
                  const val = room[key as StringKey];
                  if (val == null || String(val).trim() === "") return null;
                  return (
                    <MetaRow
                      key={key}
                      label={d.roomStrings[key as StringKey]}
                      value={String(val)}
                      c={c}
                    />
                  );
                })}
                <MetaRow label={d.meta.createdAt} value={room.created_at ?? d.unknown} c={c} />
                <MetaRow label={d.meta.updatedAt} value={room.updated_at ?? d.unknown} c={c} />
              </>
            )}
          </Section>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
  c,
}: {
  title: string;
  children: ReactNode;
  c: {
    card: string;
    border: string;
    primary: string;
    title: string;
  };
}) {
  return (
    <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={[styles.sectionBar, { backgroundColor: c.primary }]} />
      <ThemedText style={[styles.sectionTitle, { color: c.title }]}>{title}</ThemedText>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function MetaRow({
  label,
  value,
  c,
}: {
  label: string;
  value: string;
  c: Record<string, string>;
}) {
  return (
    <View style={styles.metaRow}>
      <ThemedText style={[styles.metaLabel, { color: c.hint }]} numberOfLines={2}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.metaValue, { color: c.title }]} numberOfLines={3}>
        {value}
      </ThemedText>
    </View>
  );
}

function FeeChip({
  label,
  value,
  c,
}: {
  label: string;
  value: string;
  c: Record<string, string>;
}) {
  return (
    <View style={[styles.feeChip, { backgroundColor: c.chipOff }]}>
      <ThemedText style={[styles.feeChipLabel, { color: c.hint }]} numberOfLines={1}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.feeChipValue, { color: c.title }]} numberOfLines={1}>
        {value}
      </ThemedText>
    </View>
  );
}

function AmenityChip({
  label,
  value,
  yes,
  no,
  unknown,
  c,
}: {
  label: string;
  value: boolean | null;
  yes: string;
  no: string;
  unknown: string;
  c: Record<string, string>;
}) {
  const text = boolLabel(value, yes, no, unknown);
  const on = value === true;
  return (
    <View
      style={[
        styles.amenityChip,
        { backgroundColor: on ? c.chipOn : c.chipOff },
      ]}
    >
      <ThemedText
        style={[styles.amenityChipText, { color: on ? c.chipTextOn : c.chipTextOff }]}
        numberOfLines={1}
      >
        {label}: {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "700", marginHorizontal: 8 },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  stateText: { fontSize: 15, textAlign: "center" },
  retryBtn: {
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 14,
  },
  hero: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  heroTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  heroTextCol: { flex: 1, gap: 6 },
  heroName: { fontSize: 22, fontWeight: "800", lineHeight: 28 },
  heroMetaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroMeta: { fontSize: 13 },
  priceTag: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 108,
    gap: 4,
  },
  priceTagLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
  priceTagValue: { fontSize: 15, fontWeight: "800" },
  mapRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  addressText: { flex: 1, fontSize: 14, lineHeight: 20 },
  wifiRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  section: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  sectionBar: { height: 3, width: "100%" },
  sectionTitle: { fontSize: 16, fontWeight: "800", paddingHorizontal: 16, paddingTop: 14 },
  sectionBody: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 12, gap: 10 },
  amenitiesBox: { borderRadius: 12, padding: 12, marginBottom: 4 },
  amenitiesMono: { fontSize: 12, lineHeight: 18, fontFamily: "monospace" },
  metaRow: { gap: 4 },
  metaLabel: { fontSize: 12, fontWeight: "600" },
  metaValue: { fontSize: 14, lineHeight: 20 },
  feeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  feeChip: {
    width: "48%",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 4,
  },
  feeChipLabel: { fontSize: 11 },
  feeChipValue: { fontSize: 13, fontWeight: "700" },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenityChip: { borderRadius: 20, paddingVertical: 6, paddingHorizontal: 10, maxWidth: "100%" },
  amenityChipText: { fontSize: 12, fontWeight: "600" },
  noRoom: { fontSize: 14, lineHeight: 20 },
});
