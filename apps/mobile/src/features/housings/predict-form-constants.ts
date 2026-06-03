import { formatFeeDigits } from "@/src/features/housings/predict-fee-format";
import type { RoomBoolKey } from "@/src/features/housings/house-detail/constants";
import { ROOM_BOOL_KEYS } from "@/src/features/housings/house-detail/constants";
import {
  emptyRoomOptionState,
  isRoomOptionFilled,
  PREDICT_ROOM_DROPDOWN_KEYS,
  PREDICT_REQUIRED_ROOM_DROPDOWN_KEYS,
  type PredictRoomDropdownKey,
  type RoomOptionFieldState,
} from "@/src/features/housings/predict-room-field-options";

export { isRoomOptionFilled, PREDICT_REQUIRED_ROOM_DROPDOWN_KEYS };

export const isAddressRequiredFilled = (latitude: string, longitude: string) => {
  const lat = Number(latitude);
  const lng = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lng);
};

export const areRequiredRoomOptionsFilled = (
  roomOptions: Record<PredictRoomDropdownKey, RoomOptionFieldState>,
) => PREDICT_REQUIRED_ROOM_DROPDOWN_KEYS.every((key) => isRoomOptionFilled(roomOptions[key]));

export const MID_HIGH_PRICE_VND = 5_000_000;

/** Extra loading time after predict API returns (ms). */
export const PREDICT_LOADING_WAIT_MS = 5000;

export const FEE_KEYS = [
  "electricity_fee",
  "water_fee",
  "card_fee",
  "washing_machine_fee",
  "parking_fee",
  "garbage_fee",
  "otherfee",
] as const;

export type FeeKey = (typeof FEE_KEYS)[number];

export const FEE_PLACEHOLDERS: Record<FeeKey, string> = {
  electricity_fee: "3800",
  water_fee: "20000",
  card_fee: "0",
  washing_machine_fee: "30000",
  parking_fee: "100000",
  garbage_fee: "200000",
  otherfee: "0",
};

export const FEE_PLACEHOLDERS_FORMATTED = Object.fromEntries(
  FEE_KEYS.map((key) => [key, formatFeeDigits(FEE_PLACEHOLDERS[key])]),
) as Record<FeeKey, string>;

export const EMPTY_FEES = Object.fromEntries(FEE_KEYS.map((key) => [key, ""])) as Record<
  FeeKey,
  string
>;

export const EMPTY_ROOM_BOOL = Object.fromEntries(
  ROOM_BOOL_KEYS.map((key) => [key, false]),
) as Record<RoomBoolKey, boolean>;

export const EMPTY_ROOM_OPTIONS = Object.fromEntries(
  PREDICT_ROOM_DROPDOWN_KEYS.map((key) => [key, emptyRoomOptionState()]),
) as Record<PredictRoomDropdownKey, RoomOptionFieldState>;
