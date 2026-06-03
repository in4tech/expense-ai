import type { ApiClient } from "@/src/api";
import { apiPaths } from "@/src/api/paths";

export type HousingPredictInput = {
  electricity_fee: number;
  water_fee: number;
  card_fee: number;
  washing_machine_fee: number;
  garbage_fee: number;
  parking_fee: number;
  has_wifi: boolean;
  otherfee: number;
  latitude: number;
  longitude: number;
  kitchen: boolean;
  desk: boolean;
  bed: boolean;
  elevator: boolean;
  bancony: boolean;
  fridge: boolean;
  hotwater: boolean;
  air_conditioner: boolean;
  wardrobe: boolean;
  window: boolean;
  attic: boolean;
  skylight: boolean;
  kitchent_sink: boolean;
  drying_yard?: string;
  cooling_type?: string;
  parking_space?: string;
  toilet?: string;
  gatelock?: string;
  time?: string;
  room_area?: string;
  floor?: string;
};

export type HousingPredictResponse = {
  price: number;
};

export const predictHousingPrice = async (
  client: ApiClient,
  input: HousingPredictInput,
): Promise<HousingPredictResponse> => {
  return client.post<HousingPredictResponse>(
    apiPaths.housings.predict,
    input,
    "Housing price prediction failed",
  );
};
