import type { HousingPredictResultSnapshot } from "@/src/features/housings/build-predict-result-snapshot";

let pending: HousingPredictResultSnapshot | null = null;

export function setHousingPredictResult(snapshot: HousingPredictResultSnapshot): void {
  pending = snapshot;
}

export function consumeHousingPredictResult(): HousingPredictResultSnapshot | null {
  const data = pending;
  pending = null;
  return data;
}
