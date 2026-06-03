import type { FeeKey } from "@/src/features/housings/predict-form-constants";

export type FeeUnitOption = {
  value: string;
  label: string;
};

type FixedFeeUnit = { kind: "fixed"; unit: string };
type SelectFeeUnit = { kind: "select"; options: FeeUnitOption[]; default: string };

export const FEE_UNIT_CONFIG: Record<FeeKey, FixedFeeUnit | SelectFeeUnit> = {
  electricity_fee: { kind: "fixed", unit: "/kWh" },
  water_fee: {
    kind: "select",
    default: "ng",
    options: [
      { value: "ng", label: "/ng" },
      { value: "m3", label: "/m³" },
    ],
  },
  card_fee: { kind: "fixed", unit: "/ng" },
  washing_machine_fee: { kind: "fixed", unit: "/ng" },
  parking_fee: { kind: "fixed", unit: "/xe" },
  garbage_fee: {
    kind: "select",
    default: "ng",
    options: [
      { value: "ng", label: "/ng" },
      { value: "ph", label: "/ph" },
    ],
  },
  otherfee: { kind: "fixed", unit: "/ph" },
};

export type SelectableFeeUnitKey = "water_fee" | "garbage_fee";

export type FeeUnitsState = Record<SelectableFeeUnitKey, string>;

export const EMPTY_FEE_UNITS: FeeUnitsState = {
  water_fee: FEE_UNIT_CONFIG.water_fee.kind === "select" ? FEE_UNIT_CONFIG.water_fee.default : "ng",
  garbage_fee:
    FEE_UNIT_CONFIG.garbage_fee.kind === "select" ? FEE_UNIT_CONFIG.garbage_fee.default : "ng",
};

export const isSelectableFeeUnit = (key: FeeKey): key is SelectableFeeUnitKey =>
  FEE_UNIT_CONFIG[key].kind === "select";

export const getFeeUnitDisplay = (key: FeeKey, feeUnits: FeeUnitsState): string => {
  const config = FEE_UNIT_CONFIG[key];
  if (config.kind === "fixed") return config.unit;
  const unitKey = key as SelectableFeeUnitKey;
  const selected = feeUnits[unitKey];
  return config.options.find((o) => o.value === selected)?.label ?? config.options[0].label;
};

export const getSelectableFeeOptions = (key: SelectableFeeUnitKey): FeeUnitOption[] => {
  const config = FEE_UNIT_CONFIG[key];
  return config.kind === "select" ? config.options : [];
};
