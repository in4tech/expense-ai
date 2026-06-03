import type { RoomStringKey } from "@/src/features/housings/house-detail/constants";

export const OTHER_OPTION_VALUE = "__other__";

export type PredictRoomDropdownKey = Exclude<RoomStringKey, "floor">;

export type PredictOption = {
  value: string;
  label: string;
};

const withOther = (options: PredictOption[], otherLabel: string): PredictOption[] => [
  ...options,
  { value: OTHER_OPTION_VALUE, label: otherLabel },
];

export const PREDICT_ROOM_DROPDOWN_KEYS: PredictRoomDropdownKey[] = [
  "cooling_type",
  "parking_space",
  "toilet",
  "time",
  "gatelock",
  "drying_yard",
  "room_area",
];

/** Used by the model combined_text + room_area numeric feature. */
export const PREDICT_REQUIRED_ROOM_DROPDOWN_KEYS: PredictRoomDropdownKey[] = [
  ...PREDICT_ROOM_DROPDOWN_KEYS,
];

export const getPredictRoomFieldOptions = (otherLabel: string): Record<PredictRoomDropdownKey, PredictOption[]> => ({
  cooling_type: withOther(
    [
      { value: "Thường", label: "Thường" },
      { value: "Duplex", label: "Duplex" },
      { value: "Sleepbox", label: "Sleepbox" },
    ],
    otherLabel,
  ),
  parking_space: withOther(
    [
      { value: "Chung", label: "Chung" },
      { value: "Riêng", label: "Riêng" },
    ],
    otherLabel,
  ),
  toilet: withOther(
    [
      { value: "Chung", label: "Chung" },
      { value: "Riêng", label: "Riêng" },
    ],
    otherLabel,
  ),
  time: withOther(
    [
      { value: "Tự do", label: "Tự do" },
      { value: "Sau 22h", label: "Sau 22h" },
    ],
    otherLabel,
  ),
  gatelock: withOther(
    [
      { value: "Khóa thường", label: "Khóa thường" },
      { value: "Vân tay", label: "Vân tay" },
      { value: "Thẻ từ", label: "Thẻ từ" },
    ],
    otherLabel,
  ),
  drying_yard: withOther(
    [
      { value: "Chung", label: "Chung" },
      { value: "Riêng", label: "Riêng" },
    ],
    otherLabel,
  ),
  room_area: withOther(
    [
      { value: "20m2", label: "20m2" },
      { value: "16m2", label: "16m2" },
      { value: "18m2", label: "18m2" },
      { value: "13m2", label: "13m2" },
      { value: "26m2", label: "26m2" },
      { value: "24m2", label: "24m2" },
      { value: "25m2", label: "25m2" },
    ],
    otherLabel,
  ),
});

export type RoomOptionFieldState = {
  selected: string | null;
  custom: string;
};

export const emptyRoomOptionState = (): RoomOptionFieldState => ({
  selected: null,
  custom: "",
});

export const resolveRoomOptionValue = (state: RoomOptionFieldState): string | undefined => {
  if (!state.selected) return undefined;
  if (state.selected === OTHER_OPTION_VALUE) {
    const text = state.custom.trim();
    return text.length > 0 ? text : undefined;
  }
  return state.selected;
};

export const isRoomOptionFilled = (state: RoomOptionFieldState): boolean =>
  resolveRoomOptionValue(state) !== undefined;
