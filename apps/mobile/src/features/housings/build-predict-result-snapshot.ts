import type { RoomBoolKey, RoomStringKey } from "@/src/features/housings/house-detail/constants";
import { ROOM_BOOL_KEYS } from "@/src/features/housings/house-detail/constants";
import type {
  PredictResultRoomBoolItem,
  PredictResultRoomFieldItem,
} from "@/src/features/housings/components/predict-result-room-section";
import type { FeeKey } from "@/src/features/housings/predict-form-constants";
import { FEE_KEYS } from "@/src/features/housings/predict-form-constants";
import { parseFeeDigits } from "@/src/features/housings/predict-fee-format";
import { getFeeUnitDisplay, type FeeUnitsState } from "@/src/features/housings/predict-fee-units";
import {
  OTHER_OPTION_VALUE,
  PREDICT_ROOM_DROPDOWN_KEYS,
  resolveRoomOptionValue,
  type PredictOption,
  type PredictRoomDropdownKey,
  type RoomOptionFieldState,
} from "@/src/features/housings/predict-room-field-options";

export type PredictSummaryRow = {
  label: string;
  value: string;
};

export type HousingPredictResultSnapshot = {
  price: number;
  address: string;
  coordinates: string;
  feeRows: PredictSummaryRow[];
  wifiRow: PredictSummaryRow;
  roomBoolItems: PredictResultRoomBoolItem[];
  roomFieldItems: PredictResultRoomFieldItem[];
};

export type BuildPredictSnapshotLabels = {
  feeFields: Record<FeeKey, { label: string }>;
  addressLabel: string;
  wifiLabel: string;
  yes: string;
  no: string;
  dash: string;
  roomBool: Record<RoomBoolKey, string>;
  roomStrings: Record<PredictRoomDropdownKey | "floor", string>;
};

const formatFeeValue = (raw: string, unit: string, dash: string) => {
  const text = raw.trim();
  if (!text) return dash;
  const n = parseFeeDigits(text);
  const amount = n != null ? n.toLocaleString("vi-VN") : text;
  return `${amount} VND ${unit}`.trim();
};

const roomOptionDisplayValue = (
  key: PredictRoomDropdownKey,
  state: RoomOptionFieldState,
  options: PredictOption[],
): string | undefined => {
  const resolved = resolveRoomOptionValue(state);
  if (!resolved) return undefined;
  if (state.selected === OTHER_OPTION_VALUE) return resolved;
  return options.find((o) => o.value === state.selected)?.label ?? resolved;
};

export function buildPredictResultSnapshot(input: {
  price: number;
  fees: Record<FeeKey, string>;
  feeUnits: FeeUnitsState;
  hasWifi: boolean;
  address: string;
  latitude: number;
  longitude: number;
  roomBool: Record<RoomBoolKey, boolean>;
  roomOptions: Record<PredictRoomDropdownKey, RoomOptionFieldState>;
  floor: string;
  roomFieldOptions: Record<PredictRoomDropdownKey, PredictOption[]>;
  labels: BuildPredictSnapshotLabels;
}): HousingPredictResultSnapshot {
  const { labels: l } = input;
  const dash = l.dash;

  const feeRows: PredictSummaryRow[] = FEE_KEYS.map((key) => ({
    label: l.feeFields[key].label,
    value: formatFeeValue(input.fees[key], getFeeUnitDisplay(key, input.feeUnits), dash),
  }));

  const roomBoolItems: PredictResultRoomBoolItem[] = ROOM_BOOL_KEYS.filter(
    (key) => input.roomBool[key],
  ).map((key) => ({
    key,
    label: l.roomBool[key],
  }));

  const roomFieldItems: PredictResultRoomFieldItem[] = PREDICT_ROOM_DROPDOWN_KEYS.flatMap((key) => {
    const detail = roomOptionDisplayValue(key, input.roomOptions[key], input.roomFieldOptions[key]);
    if (!detail) return [];
    return [{ key, label: l.roomStrings[key], detail }];
  });

  const floorText = input.floor.trim();
  if (floorText) {
    roomFieldItems.push({
      key: "floor" as RoomStringKey,
      label: l.roomStrings.floor,
      detail: floorText,
    });
  }

  return {
    price: input.price,
    address: input.address.trim() || dash,
    coordinates: `${input.latitude.toFixed(5)}, ${input.longitude.toFixed(5)}`,
    feeRows,
    wifiRow: { label: l.wifiLabel, value: input.hasWifi ? l.yes : l.no },
    roomBoolItems,
    roomFieldItems,
  };
}
