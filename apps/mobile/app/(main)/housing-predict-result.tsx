import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import type { HousingPredictResultSnapshot } from "@/src/features/housings/build-predict-result-snapshot";
import { PredictResultRoomSection } from "@/src/features/housings/components/predict-result-room-section";
import { MetaRow } from "@/src/features/housings/house-detail/components/meta-row";
import { formatVndPrice } from "@/src/features/housings/house-detail/utils";
import { MID_HIGH_PRICE_VND } from "@/src/features/housings/predict-form-constants";
import { useLanguage } from "@/src/i18n";
import { consumeHousingPredictResult } from "@/src/navigation/housing-predict-result-bridge";
import { href } from "@/src/navigation/href";
import { useAppTheme } from "@/src/theme";

function SummaryBlock({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string }[];
}) {
  const { colors: c } = useAppTheme();
  if (rows.length === 0) return null;

  return (
    <View style={[styles.block, { backgroundColor: c.card, borderColor: c.border }]}>
      <ThemedText style={[styles.blockTitle, { color: c.title }]}>{title}</ThemedText>
      <View style={styles.rows}>
        {rows.map((row) => (
          <MetaRow key={`${title}-${row.label}`} label={row.label} value={row.value} />
        ))}
      </View>
    </View>
  );
}

export default function HousingPredictResultScreen() {
  const [snapshot, setSnapshot] = useState<HousingPredictResultSnapshot | null>(() =>
    consumeHousingPredictResult(),
  );
  const { dictionary } = useLanguage();
  const hp = dictionary.housingPredict;
  const hr = dictionary.housingPredictResult;
  const { colors: c } = useAppTheme();

  useEffect(() => {
    if (!snapshot) {
      router.replace(href.mainHousingPredict);
    }
  }, [snapshot]);

  const insightSegment = useMemo(() => {
    if (!snapshot) return "";
    return snapshot.price >= MID_HIGH_PRICE_VND
      ? hp.insightSegmentMidHigh
      : hp.insightSegmentBudget;
  }, [snapshot, hp.insightSegmentBudget, hp.insightSegmentMidHigh]);

  if (!snapshot) {
    return null;
  }

  const formattedPrice = formatVndPrice(snapshot.price);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.screen }]} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconBtn, { borderColor: c.border, backgroundColor: c.card }]}
        >
          <Ionicons name="chevron-back" size={18} color={c.title} />
        </Pressable>
        <ThemedText style={[styles.headerTitle, { color: c.title }]}>{hr.title}</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.priceCard, { backgroundColor: c.successBg, borderColor: c.border }]}>
          <View style={styles.priceTop}>
            <ThemedText style={[styles.priceLabel, { color: c.successText }]}>
              {hp.resultTitle}
            </ThemedText>
            <Ionicons name="analytics-outline" size={18} color={c.successText} />
          </View>
          <View style={styles.priceValueWrap}>
            <ThemedText
              style={[styles.priceValue, { color: c.successText }]}
              adjustsFontSizeToFit
              minimumFontScale={0.55}
              numberOfLines={2}
            >
              {formattedPrice}
            </ThemedText>
          </View>
          <ThemedText style={[styles.priceHint, { color: c.successText }]}>{hp.resultHint}</ThemedText>
          <ThemedText style={[styles.insight, { color: c.successText }]}>
            {hp.insightPrefix}{" "}
            <ThemedText style={styles.insightStrong}>{insightSegment}</ThemedText>.
          </ThemedText>
        </View>

        <ThemedText style={[styles.summaryHeading, { color: c.title }]}>{hr.summaryTitle}</ThemedText>

        <View style={[styles.block, { backgroundColor: c.card, borderColor: c.border }]}>
          <ThemedText style={[styles.blockTitle, { color: c.title }]}>
            {hp.fields.address.label}
          </ThemedText>
          <View style={styles.rows}>
            <MetaRow label={hp.fields.address.label} value={snapshot.address} />
            <MetaRow label={hr.coordinatesLabel} value={snapshot.coordinates} />
          </View>
        </View>

        <SummaryBlock title={hp.sectionFees} rows={snapshot.feeRows} />

        <View style={[styles.block, { backgroundColor: c.card, borderColor: c.border }]}>
          <ThemedText style={[styles.blockTitle, { color: c.title }]}>{hp.wifiLabel}</ThemedText>
          <MetaRow label={snapshot.wifiRow.label} value={snapshot.wifiRow.value} />
        </View>

        <PredictResultRoomSection
          amenitiesTitle={hr.roomAmenitiesTitle}
          detailsTitle={hr.roomDetailsTitle}
          noAmenitiesText={hr.noAmenities}
          boolItems={snapshot.roomBoolItems}
          fieldItems={snapshot.roomFieldItems}
        />
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: c.screen, borderColor: c.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.secondaryBtn, { borderColor: c.border, backgroundColor: c.card }]}
        >
          <ThemedText style={[styles.secondaryBtnText, { color: c.title }]}>{hr.editAgain}</ThemedText>
        </Pressable>
      </View>
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
    paddingVertical: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 22, fontWeight: "700", flex: 1 },
  content: { paddingHorizontal: 16, paddingVertical: 16, gap: 12, paddingBottom: 24 },
  priceCard: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  priceTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  priceLabel: { fontSize: 13, fontWeight: "600", flex: 1 },
  priceValueWrap: { width: "100%", minHeight: 40, justifyContent: "center" },
  priceValue: {
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 32,
    flexShrink: 1,
  },
  priceHint: { fontSize: 12, opacity: 0.9 },
  insight: { fontSize: 12, opacity: 0.9, marginTop: 4 },
  insightStrong: { fontWeight: "700" },
  summaryHeading: { fontSize: 15, fontWeight: "700", marginTop: 4 },
  block: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 10 },
  blockTitle: { fontSize: 14, fontWeight: "700" },
  rows: { gap: 10 },
  footer: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  secondaryBtn: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { fontWeight: "700", fontSize: 15 },
});
