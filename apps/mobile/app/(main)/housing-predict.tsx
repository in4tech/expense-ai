import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { useLanguage } from "@/src/i18n";
import { href } from "@/src/navigation/href";
import { subscribeLocationPick } from "@/src/navigation/location-pick-bridge";

type NumericFieldKey = "medInc" | "houseAge" | "aveRooms" | "aveBedrms" | "population" | "aveOccup";

type FieldMeta = {
  key: NumericFieldKey;
  placeholder: string;
};

const INITIAL_NUMERIC: Record<NumericFieldKey, string> = {
  medInc: "3.0",
  houseAge: "20.0",
  aveRooms: "5.0",
  aveBedrms: "1.0",
  population: "1000.0",
  aveOccup: "3.0",
};

const FIELD_META: FieldMeta[] = [
  { key: "medInc", placeholder: "3.0" },
  { key: "houseAge", placeholder: "20" },
  { key: "aveRooms", placeholder: "5.0" },
  { key: "aveBedrms", placeholder: "1.0" },
  { key: "population", placeholder: "1000" },
  { key: "aveOccup", placeholder: "3.0" },
];

const toNumber = (value: string) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export default function HousingPredictScreen() {
  const [numericFields, setNumericFields] = useState<Record<NumericFieldKey, string>>(INITIAL_NUMERIC);
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [predictedPrice, setPredictedPrice] = useState<number | null>(null);
  const { dictionary } = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    return subscribeLocationPick((result) => {
      setAddress(result.address);
      setLatitude(String(result.latitude));
      setLongitude(String(result.longitude));
    });
  }, []);

  const c = {
    screen: isDark ? "#0B0B0F" : "#F5F7FB",
    card: isDark ? "#17181D" : "#FFFFFF",
    cardMuted: isDark ? "#111217" : "#F8FAFC",
    title: isDark ? "#F3F4F6" : "#0F172A",
    text: isDark ? "#CBD5E1" : "#334155",
    hint: isDark ? "#94A3B8" : "#64748B",
    primary: "#4F46E5",
    border: isDark ? "#2B2D33" : "#E2E8F0",
    successBg: isDark ? "#123520" : "#DCFCE7",
    successText: isDark ? "#86EFAC" : "#166534",
  };

  const allValid = useMemo(() => {
    const numsOk = FIELD_META.every((field) => toNumber(numericFields[field.key]) !== null);
    const coordsOk = toNumber(latitude) !== null && toNumber(longitude) !== null;
    const addrOk = address.trim().length > 0;
    return numsOk && coordsOk && addrOk;
  }, [numericFields, latitude, longitude, address]);

  const handleNumericChange = (key: NumericFieldKey, value: string) => {
    setNumericFields((prev) => ({ ...prev, [key]: value }));
  };

  const openMapPicker = () => {
    router.push(href.mainMapPickLocation);
  };

  const handlePredict = () => {
    const medInc = toNumber(numericFields.medInc) ?? 0;
    const houseAge = toNumber(numericFields.houseAge) ?? 0;
    const aveRooms = toNumber(numericFields.aveRooms) ?? 0;
    const aveBedrms = toNumber(numericFields.aveBedrms) ?? 0;
    const population = toNumber(numericFields.population) ?? 0;
    const aveOccup = toNumber(numericFields.aveOccup) ?? 0;

    const score =
      medInc * 0.45 +
      houseAge * 0.01 +
      aveRooms * 0.18 -
      aveBedrms * 0.12 -
      population * 0.00003 -
      aveOccup * 0.02;
    const price = Math.max(0.4, score) * 100000;
    setPredictedPrice(price);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.screen }]} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconBtn, { borderColor: c.border, backgroundColor: c.card }]}
        >
          <Ionicons name="chevron-back" size={18} color={c.title} />
        </Pressable>
        <ThemedText style={[styles.headerTitle, { color: c.title }]}>
          {dictionary.housingPredict.title}
        </ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[styles.heroIconWrap, { backgroundColor: c.cardMuted }]}>
            <Ionicons name="sparkles-outline" size={18} color={c.primary} />
          </View>
          <View style={styles.heroTextWrap}>
            <ThemedText style={[styles.heroTitle, { color: c.title }]}>
              {dictionary.housingPredict.heroTitle}
            </ThemedText>
            <ThemedText style={[styles.heroDesc, { color: c.hint }]}>
              {dictionary.housingPredict.heroDesc}
            </ThemedText>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.cardHead}>
            <ThemedText style={[styles.cardTitle, { color: c.title }]}>
              {dictionary.housingPredict.inputTitle}
            </ThemedText>
            <ThemedText style={[styles.cardSubtitle, { color: c.hint }]}>
              {dictionary.housingPredict.inputSubtitle}
            </ThemedText>
          </View>
          <View style={styles.fieldGrid}>
            {FIELD_META.map((field) => (
              <View key={field.key} style={styles.fieldWrap}>
                <View style={styles.labelRow}>
                  <ThemedText style={[styles.label, { color: c.hint }]}>
                    {dictionary.housingPredict.fields[field.key].label}
                  </ThemedText>
                  <ThemedText style={[styles.unit, { color: c.hint }]}>
                    {dictionary.housingPredict.fields[field.key].unit}
                  </ThemedText>
                </View>
                <TextInput
                  value={numericFields[field.key]}
                  onChangeText={(value) => handleNumericChange(field.key, value)}
                  keyboardType="decimal-pad"
                  style={[
                    styles.input,
                    {
                      borderColor: c.border,
                      color: c.title,
                      backgroundColor: c.cardMuted,
                    },
                  ]}
                  placeholder={field.placeholder}
                  placeholderTextColor={c.hint}
                />
              </View>
            ))}
          </View>

          <View style={styles.addressBlock}>
            <View style={styles.labelRow}>
              <ThemedText style={[styles.label, { color: c.hint }]}>
                {dictionary.housingPredict.fields.address.label}
              </ThemedText>
              <ThemedText style={[styles.unit, { color: c.hint }]}>
                {dictionary.housingPredict.fields.address.unit}
              </ThemedText>
            </View>
            <Pressable
              onPress={openMapPicker}
              style={[
                styles.addressPressable,
                {
                  borderColor: c.border,
                  backgroundColor: c.cardMuted,
                },
              ]}
            >
              <Ionicons name="map-outline" size={18} color={c.primary} />
              <View style={styles.addressTextCol}>
                <ThemedText
                  style={[styles.addressMain, { color: address ? c.title : c.hint }]}
                  numberOfLines={2}
                >
                  {address || dictionary.housingPredict.addressTapHint}
                </ThemedText>
                {latitude && longitude ? (
                  <ThemedText style={[styles.addressCoords, { color: c.hint }]} numberOfLines={1}>
                    {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
                  </ThemedText>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.hint} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.resultCard, { backgroundColor: c.successBg, borderColor: c.border }]}>
          <View style={styles.resultTop}>
            <ThemedText style={[styles.resultLabel, { color: c.successText }]}>
              {dictionary.housingPredict.resultTitle}
            </ThemedText>
            <Ionicons name="analytics-outline" size={16} color={c.successText} />
          </View>
          <ThemedText style={[styles.resultValue, { color: c.successText }]}>
            {predictedPrice != null
              ? `$${predictedPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
              : dictionary.housingPredict.resultEmpty}
          </ThemedText>
          <ThemedText style={[styles.resultHint, { color: c.successText }]}>
            {dictionary.housingPredict.resultHint}
          </ThemedText>
        </View>

        {predictedPrice == null ? null : (
          <View style={[styles.resultCard, { backgroundColor: c.successBg, borderColor: c.border }]}>
            <ThemedText style={[styles.resultLabel, { color: c.successText }]}>
              {dictionary.housingPredict.insightTitle}
            </ThemedText>
            <ThemedText style={[styles.resultHint, { color: c.successText }]}>
              {dictionary.housingPredict.insightPrefix}{" "}
              <ThemedText style={[styles.resultHintStrong, { color: c.successText }]}>
                {predictedPrice > 350000
                  ? dictionary.housingPredict.insightSegmentMidHigh
                  : dictionary.housingPredict.insightSegmentBudget}
              </ThemedText>
              .
            </ThemedText>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: c.screen, borderColor: c.border }]}>
        <Pressable
          onPress={handlePredict}
          disabled={!allValid}
          style={[
            styles.predictBtn,
            {
              backgroundColor: allValid ? c.primary : c.border,
              opacity: allValid ? 1 : 0.7,
            },
          ]}
        >
          <Ionicons name="sparkles-outline" size={16} color="#FFFFFF" />
          <ThemedText style={styles.predictBtnText}>{dictionary.housingPredict.predictButton}</ThemedText>
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
  headerTitle: { fontSize: 22, fontWeight: "700" },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  heroIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextWrap: { flex: 1, gap: 3 },
  heroTitle: { fontSize: 15, fontWeight: "700" },
  heroDesc: { fontSize: 12, lineHeight: 17 },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  cardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardSubtitle: { fontSize: 12, fontWeight: "500" },
  fieldGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  fieldWrap: { gap: 6, width: "48.5%" },
  addressBlock: { gap: 6, marginTop: 4 },
  addressPressable: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  addressTextCol: { flex: 1, gap: 2 },
  addressMain: { fontSize: 14, lineHeight: 19 },
  addressCoords: { fontSize: 11 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  label: { fontSize: 12, fontWeight: "500" },
  unit: { fontSize: 11, fontWeight: "500", opacity: 0.85 },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  predictBtn: {
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  predictBtnText: { color: "#FFFFFF", fontWeight: "700" },
  resultCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  resultTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  resultLabel: { fontSize: 13, fontWeight: "600" },
  resultValue: { fontSize: 22, fontWeight: "800" },
  resultHint: { fontSize: 12, opacity: 0.9 },
  resultHintStrong: { fontWeight: "700" },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
});
