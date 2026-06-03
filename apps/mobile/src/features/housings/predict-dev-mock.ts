import { buildPredictResultSnapshot } from "@/src/features/housings/build-predict-result-snapshot";
import type { BuildPredictSnapshotLabels } from "@/src/features/housings/build-predict-result-snapshot";
import type { HousingPredictResultSnapshot } from "@/src/features/housings/build-predict-result-snapshot";
import type { RoomBoolKey } from "@/src/features/housings/house-detail/constants";
import { EMPTY_FEES, EMPTY_ROOM_BOOL } from "@/src/features/housings/predict-form-constants";
import { EMPTY_FEE_UNITS } from "@/src/features/housings/predict-fee-units";
import {
  getPredictRoomFieldOptions,
  PREDICT_ROOM_DROPDOWN_KEYS,
  type PredictRoomDropdownKey,
  type RoomOptionFieldState,
} from "@/src/features/housings/predict-room-field-options";

const MOCK_PRICE_VND = 5_200_000;
const MOCK_ADDRESS = "123 Nguyễn Huệ, Quận 1, TP.HCM";
const MOCK_LAT = 10.772;
const MOCK_LNG = 106.6983;

const MOCK_FEES = {
  ...EMPTY_FEES,
  electricity_fee: "3800",
  water_fee: "20000",
  card_fee: "50000",
  washing_machine_fee: "30000",
  parking_fee: "100000",
  garbage_fee: "200000",
  otherfee: "0",
} as typeof EMPTY_FEES;

const MOCK_FEE_UNITS = {
  ...EMPTY_FEE_UNITS,
  water_fee: "m3",
  garbage_fee: "ph",
};

const MOCK_ROOM_BOOL: Partial<Record<RoomBoolKey, boolean>> = {
  kitchen: true,
  bed: true,
  air_conditioner: true,
  fridge: true,
  window: true,
  bancony: true,
};

const MOCK_ROOM_OPTION_VALUES: Record<PredictRoomDropdownKey, string> = {
  cooling_type: "Thường",
  parking_space: "Riêng",
  toilet: "Riêng",
  time: "Tự do",
  gatelock: "Vân tay",
  drying_yard: "Riêng",
  room_area: "20m2",
};

const roomOptionsFromValues = (
  values: Record<PredictRoomDropdownKey, string>,
): Record<PredictRoomDropdownKey, RoomOptionFieldState> =>
  Object.fromEntries(
    PREDICT_ROOM_DROPDOWN_KEYS.map((key) => [key, { selected: values[key], custom: "" }]),
  ) as Record<PredictRoomDropdownKey, RoomOptionFieldState>;

/** Dev-only snapshot for testing predict result UI without calling the API. */
export function buildMockPredictResultSnapshot(
  labels: BuildPredictSnapshotLabels,
  otherOptionLabel: string,
): HousingPredictResultSnapshot {
  const roomFieldOptions = getPredictRoomFieldOptions(otherOptionLabel);

  return buildPredictResultSnapshot({
    price: MOCK_PRICE_VND,
    fees: MOCK_FEES,
    feeUnits: MOCK_FEE_UNITS,
    hasWifi: true,
    address: MOCK_ADDRESS,
    latitude: MOCK_LAT,
    longitude: MOCK_LNG,
    roomBool: { ...EMPTY_ROOM_BOOL, ...MOCK_ROOM_BOOL },
    roomOptions: roomOptionsFromValues(MOCK_ROOM_OPTION_VALUES),
    floor: "Lầu 2",
    roomFieldOptions,
    labels,
  });
}
