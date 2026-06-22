import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

import type { Housing } from "@/src/features/housings/types";
import type { Dictionary } from "@/src/i18n";

type FeeIconName = ComponentProps<typeof Ionicons>["name"];

type HomeFeeLabelKey = keyof Pick<
  Dictionary["home"],
  "electricityFee" | "waterFee" | "parkingFee" | "garbageFee"
>;

export type HomeFeeRowConfig = {
  icon: FeeIconName;
  feeKey: keyof Pick<Housing, "electricity_fee" | "water_fee" | "parking_fee" | "garbage_fee">;
  unitKey: keyof Pick<
    Housing,
    "electricity_unit" | "water_unit" | "parking_unit" | "garbage_unit"
  >;
  labelKey: HomeFeeLabelKey;
};

export const HOME_LIST_LIMIT = 60;

/** Horizontal carousel on home shows at most this many listings (photo-first). */
export const HOME_POPULAR_PREVIEW_LIMIT = 5;

/** Dev-only minimum skeleton duration before home listings data appears. */
export const HOME_HOUSINGS_MIN_LOADING_MS = 3000;

export const HOME_FEE_ROWS: readonly HomeFeeRowConfig[] = [
  { icon: "flash-outline", feeKey: "electricity_fee", unitKey: "electricity_unit", labelKey: "electricityFee" },
  { icon: "water-outline", feeKey: "water_fee", unitKey: "water_unit", labelKey: "waterFee" },
  { icon: "car-outline", feeKey: "parking_fee", unitKey: "parking_unit", labelKey: "parkingFee" },
  { icon: "trash-outline", feeKey: "garbage_fee", unitKey: "garbage_unit", labelKey: "garbageFee" },
] as const;
