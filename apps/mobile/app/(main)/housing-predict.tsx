import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { StackIconButton } from "@/src/components/stack-icon-button";
import {
  predictHousingPrice,
  type HousingPredictInput,
} from "@/src/features/housings";
import { buildPredictResultSnapshot } from "@/src/features/housings/build-predict-result-snapshot";
import { FeeUnitSelector } from "@/src/features/housings/components/fee-unit-selector";
import { PredictLoadingOverlay } from "@/src/features/housings/components/predict-loading-overlay";
import { PredictRoomOptionField } from "@/src/features/housings/components/predict-room-option-field";
import {
  ROOM_BOOL_KEYS,
  type RoomBoolKey,
} from "@/src/features/housings/house-detail/constants";
import {
  areRequiredRoomOptionsFilled,
  EMPTY_FEES,
  EMPTY_ROOM_BOOL,
  EMPTY_ROOM_OPTIONS,
  FEE_KEYS,
  FEE_PLACEHOLDERS_FORMATTED,
  isAddressRequiredFilled,
  PREDICT_LOADING_WAIT_MS,
  PREDICT_REQUIRED_ROOM_DROPDOWN_KEYS,
  type FeeKey,
} from "@/src/features/housings/predict-form-constants";
import {
  EMPTY_FEE_UNITS,
  getFeeUnitDisplay,
  getSelectableFeeOptions,
  isSelectableFeeUnit,
  type FeeUnitsState,
} from "@/src/features/housings/predict-fee-units";
import {
  getPredictRoomFieldOptions,
  PREDICT_ROOM_DROPDOWN_KEYS,
  resolveRoomOptionValue,
  type PredictRoomDropdownKey,
  type RoomOptionFieldState,
} from "@/src/features/housings/predict-room-field-options";
import { formatFeeDigits, parseFeeDigits } from "@/src/features/housings/predict-fee-format";
import { useLanguage } from "@/src/i18n";
import { setHousingPredictResult } from "@/src/navigation/housing-predict-result-bridge";
import { href } from "@/src/navigation/href";
import { subscribeLocationPick } from "@/src/navigation/location-pick-bridge";
import { useAuth } from "@/src/providers/auth-context";
import { useAppTheme } from "@/src/theme";

const toNumber = (value: string) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const trimOptional = (value: string) => {
  const text = value.trim();
  return text.length > 0 ? text : undefined;
};

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function HousingPredictScreen() {
  const [fees, setFees] = useState<Record<FeeKey, string>>(EMPTY_FEES);
  const [feeUnits, setFeeUnits] = useState<FeeUnitsState>(EMPTY_FEE_UNITS);
  const [hasWifi, setHasWifi] = useState(false);
  const [roomBool, setRoomBool] = useState<Record<RoomBoolKey, boolean>>(EMPTY_ROOM_BOOL);
  const [roomOptions, setRoomOptions] =
    useState<Record<PredictRoomDropdownKey, RoomOptionFieldState>>(EMPTY_ROOM_OPTIONS);
  const [floor, setFloor] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [predictError, setPredictError] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  const { getApiClient } = useAuth();
  const client = useMemo(() => getApiClient(), [getApiClient]);
  const { dictionary } = useLanguage();
  const hp = dictionary.housingPredict;
  const hd = dictionary.houseDetail;
  const roomLabels = dictionary.houseDetail.roomBool;
  const roomStringLabels = dictionary.houseDetail.roomStrings;
  const roomFieldOptions = useMemo(
    () => getPredictRoomFieldOptions(hp.otherOption),
    [hp.otherOption],
  );
  const { colors: c } = useAppTheme();

  useEffect(() => {
    return subscribeLocationPick((result) => {
      setAddress(result.address);
      setLatitude(String(result.latitude));
      setLongitude(String(result.longitude));
    });
  }, []);

  const addressValid = useMemo(
    () => isAddressRequiredFilled(latitude, longitude),
    [latitude, longitude],
  );

  const requiredRoomOptionsValid = useMemo(
    () => areRequiredRoomOptionsFilled(roomOptions),
    [roomOptions],
  );

  const canPredict = addressValid && requiredRoomOptionsValid && !isPredicting;

  const isRoomDropdownRequired = (key: PredictRoomDropdownKey) =>
    PREDICT_REQUIRED_ROOM_DROPDOWN_KEYS.includes(key);

  const buildPayload = (): HousingPredictInput => {
    const lat = toNumber(latitude)!;
    const lng = toNumber(longitude)!;

    const payload: HousingPredictInput = {
      electricity_fee: parseFeeDigits(fees.electricity_fee) ?? 0,
      water_fee: parseFeeDigits(fees.water_fee) ?? 0,
      card_fee: parseFeeDigits(fees.card_fee) ?? 0,
      washing_machine_fee: parseFeeDigits(fees.washing_machine_fee) ?? 0,
      parking_fee: parseFeeDigits(fees.parking_fee) ?? 0,
      garbage_fee: parseFeeDigits(fees.garbage_fee) ?? 0,
      otherfee: parseFeeDigits(fees.otherfee) ?? 0,
      has_wifi: hasWifi,
      latitude: lat,
      longitude: lng,
      kitchen: roomBool.kitchen,
      desk: roomBool.desk,
      bed: roomBool.bed,
      elevator: roomBool.elevator,
      bancony: roomBool.bancony,
      fridge: roomBool.fridge,
      hotwater: roomBool.hotwater,
      air_conditioner: roomBool.air_conditioner,
      wardrobe: roomBool.wardrobe,
      window: roomBool.window,
      attic: roomBool.attic,
      skylight: roomBool.skylight,
      kitchent_sink: roomBool.kitchent_sink,
      drying_yard: resolveRoomOptionValue(roomOptions.drying_yard),
      cooling_type: resolveRoomOptionValue(roomOptions.cooling_type),
      parking_space: resolveRoomOptionValue(roomOptions.parking_space),
      toilet: resolveRoomOptionValue(roomOptions.toilet),
      gatelock: resolveRoomOptionValue(roomOptions.gatelock),
      time: resolveRoomOptionValue(roomOptions.time),
      room_area: resolveRoomOptionValue(roomOptions.room_area),
      floor: trimOptional(floor),
    };

    return payload;
  };

  const handlePredict = async () => {
    if (!canPredict) return;
    setIsPredicting(true);
    setPredictError(null);
    try {
      const lat = toNumber(latitude)!;
      const lng = toNumber(longitude)!;
      const result = await predictHousingPrice(client, buildPayload());
      await wait(PREDICT_LOADING_WAIT_MS);
      const snapshot = buildPredictResultSnapshot({
        price: result.price,
        fees,
        feeUnits,
        hasWifi,
        address,
        latitude: lat,
        longitude: lng,
        roomBool,
        roomOptions,
        floor,
        roomFieldOptions,
        labels: {
          feeFields: hp.fields,
          addressLabel: hp.fields.address.label,
          wifiLabel: hp.wifiLabel,
          yes: hd.yes,
          no: hd.no,
          dash: hd.unknown,
          roomBool: roomLabels,
          roomStrings: roomStringLabels,
        },
      });
      setHousingPredictResult(snapshot);
      router.push(href.mainHousingPredictResult);
    } catch (error) {
      setPredictError(error instanceof Error ? error.message : hp.resultEmpty);
    } finally {
      setIsPredicting(false);
    }
  };

  const openMapPicker = () => {
    router.push(href.mainMapPickLocation);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.screen }]} edges={["top", "bottom"]}>
      <PredictLoadingOverlay visible={isPredicting} message={hp.predicting} />
      <View style={styles.header}>
        <StackIconButton onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={18} color={c.title} />
        </StackIconButton>
        <ThemedText style={[styles.headerTitle, { color: c.title }]}>{hp.title}</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[styles.heroIconWrap, { backgroundColor: c.cardMuted }]}>
            <Ionicons name="sparkles-outline" size={18} color={c.primary} />
          </View>
          <View style={styles.heroTextWrap}>
            <ThemedText style={[styles.heroTitle, { color: c.title }]}>{hp.heroTitle}</ThemedText>
            <ThemedText style={[styles.heroDesc, { color: c.hint }]}>{hp.heroDesc}</ThemedText>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.cardHead}>
            <ThemedText style={[styles.cardTitle, { color: c.title }]}>{hp.inputTitle}</ThemedText>
            <ThemedText style={[styles.cardSubtitle, { color: c.hint }]}>{hp.inputSubtitle}</ThemedText>
          </View>
          <ThemedText style={[styles.requiredHint, { color: c.hint }]}>{hp.requiredHint}</ThemedText>

          <ThemedText style={[styles.sectionLabel, { color: c.title }]}>{hp.sectionFees}</ThemedText>
          <View style={styles.fieldGrid}>
            {FEE_KEYS.map((key) => (
              <View key={key} style={styles.fieldWrap}>
                <View style={styles.labelRow}>
                  <ThemedText style={[styles.label, { color: c.hint }]} numberOfLines={1}>
                    {hp.fields[key].label}
                  </ThemedText>
                  <View style={styles.unitSlot}>
                    {isSelectableFeeUnit(key) ? (
                      <FeeUnitSelector
                        options={getSelectableFeeOptions(key)}
                        value={feeUnits[key]}
                        onChange={(value) =>
                          setFeeUnits((prev) => ({ ...prev, [key]: value }))
                        }
                      />
                    ) : (
                      <ThemedText style={[styles.unit, { color: c.hint }]} numberOfLines={1}>
                        {getFeeUnitDisplay(key, feeUnits)}
                      </ThemedText>
                    )}
                  </View>
                </View>
                <View
                  style={[
                    styles.feeInputWrap,
                    { borderColor: c.border, backgroundColor: c.cardMuted },
                  ]}
                >
                  <TextInput
                    value={fees[key]}
                    onChangeText={(value) =>
                      setFees((prev) => ({ ...prev, [key]: formatFeeDigits(value) }))
                    }
                    keyboardType="number-pad"
                    style={[styles.feeInput, { color: c.title }]}
                    placeholder={FEE_PLACEHOLDERS_FORMATTED[key]}
                    placeholderTextColor={c.hint}
                  />
                  <ThemedText style={[styles.feeInputSuffix, { color: c.hint }]}>
                    {hp.currencySuffix}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.wifiRow, { borderColor: c.border }]}>
            <ThemedText style={[styles.wifiLabel, { color: c.title }]}>{hp.wifiLabel}</ThemedText>
            <Switch
              value={hasWifi}
              onValueChange={setHasWifi}
              trackColor={{ false: c.border, true: c.primary }}
            />
          </View>

          <View style={styles.addressLabelRow}>
            <ThemedText style={[styles.sectionLabel, { color: c.title }]}>
              {hp.fields.address.label}
            </ThemedText>
            <ThemedText style={[styles.requiredMark, { color: c.danger }]}> *</ThemedText>
          </View>
          <Pressable
            onPress={openMapPicker}
            style={[styles.addressPressable, { borderColor: c.border, backgroundColor: c.cardMuted }]}
          >
            <Ionicons name="map-outline" size={18} color={c.primary} />
            <View style={styles.addressTextCol}>
              <ThemedText
                style={[styles.addressMain, { color: address ? c.title : c.hint }]}
                numberOfLines={2}
              >
                {address || hp.addressTapHint}
              </ThemedText>
              {addressValid ? (
                <ThemedText style={[styles.addressCoords, { color: c.hint }]} numberOfLines={1}>
                  {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
                </ThemedText>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.hint} />
          </Pressable>

          <ThemedText style={[styles.sectionLabel, { color: c.title, marginTop: 8 }]}>
            {hp.sectionRoom}
          </ThemedText>
          <View style={styles.roomBoolGrid}>
            {ROOM_BOOL_KEYS.map((key) => (
              <Pressable
                key={key}
                onPress={() => setRoomBool((prev) => ({ ...prev, [key]: !prev[key] }))}
                style={[
                  styles.roomBoolChip,
                  {
                    borderColor: roomBool[key] ? c.primary : c.border,
                    backgroundColor: roomBool[key] ? c.chipOn : c.cardMuted,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.roomBoolText,
                    { color: roomBool[key] ? c.chipTextOn : c.hint },
                  ]}
                  numberOfLines={2}
                >
                  {roomLabels[key]}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          <View style={styles.roomStringList}>
            {PREDICT_ROOM_DROPDOWN_KEYS.map((key) => (
              <PredictRoomOptionField
                key={key}
                label={roomStringLabels[key]}
                required={isRoomDropdownRequired(key)}
                placeholder={hp.selectPlaceholder}
                otherPlaceholder={hp.otherInputPlaceholder}
                options={roomFieldOptions[key]}
                state={roomOptions[key]}
                onChange={(state) =>
                  setRoomOptions((prev) => ({ ...prev, [key]: state }))
                }
              />
            ))}
            <View style={styles.fieldWrapFull}>
              <ThemedText style={[styles.label, { color: c.hint }]}>
                {roomStringLabels.floor}
              </ThemedText>
              <TextInput
                value={floor}
                onChangeText={setFloor}
                style={[
                  styles.input,
                  { borderColor: c.border, color: c.title, backgroundColor: c.cardMuted },
                ]}
                placeholder={roomStringLabels.floor}
                placeholderTextColor={c.hint}
              />
            </View>
          </View>
        </View>

        {predictError ? (
          <View style={[styles.errorBanner, { backgroundColor: c.card, borderColor: c.border }]}>
            <Ionicons name="alert-circle-outline" size={18} color={c.hint} />
            <ThemedText style={[styles.errorText, { color: c.title }]}>{predictError}</ThemedText>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: c.screen, borderColor: c.border }]}>
        <Pressable
          onPress={() => void handlePredict()}
          disabled={!canPredict}
          style={[
            styles.predictBtn,
            { backgroundColor: canPredict ? c.primary : c.border, opacity: canPredict ? 1 : 0.7 },
          ]}
        >
          <Ionicons name="sparkles-outline" size={16} color="#FFFFFF" />
          <ThemedText style={styles.predictBtnText}>
            {isPredicting ? hp.predicting : hp.predictButton}
          </ThemedText>
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
  headerTitle: { fontSize: 22, fontWeight: "700" },
  content: { paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
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
  card: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 10 },
  cardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardSubtitle: { fontSize: 12, fontWeight: "500" },
  requiredHint: { fontSize: 11, lineHeight: 15 },
  addressLabelRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  requiredMark: { fontSize: 13, fontWeight: "700" },
  sectionLabel: { fontSize: 13, fontWeight: "700" },
  fieldGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 10,
    rowGap: 10,
  },
  fieldWrap: { gap: 6, width: "48%" },
  fieldWrapFull: { gap: 6, width: "100%" },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 28,
  },
  label: { flex: 1, fontSize: 12, fontWeight: "500" },
  unitSlot: {
    width: 54,
    height: 26,
    justifyContent: "center",
    alignItems: "stretch",
  },
  unit: {
    fontSize: 11,
    fontWeight: "600",
    opacity: 0.85,
    textAlign: "right",
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  feeInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingRight: 10,
  },
  feeInput: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 0,
    fontSize: 14,
    textAlignVertical: "center",
  },
  feeInputSuffix: { fontSize: 11, fontWeight: "600", alignSelf: "center" },
  wifiRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
  },
  wifiLabel: { fontSize: 14, fontWeight: "600" },
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
  roomBoolGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 10,
    rowGap: 10,
  },
  roomBoolChip: {
    width: "48%",
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  roomBoolText: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    width: "100%",
  },
  roomStringList: { gap: 8 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18 },
  predictBtn: {
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  predictBtnText: { color: "#FFFFFF", fontWeight: "700" },
  footer: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
});
