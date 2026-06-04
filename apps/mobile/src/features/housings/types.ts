export type Housing = {
  id: string;
  house_name: string | null;
  room_code: string | null;
  price: number | null;
  address: string | null;
  has_wifi: boolean | null;
  room_id: string | null;
  electricity_fee: number | null;
  water_fee: number | null;
  parking_fee: number | null;
  garbage_fee: number | null;
  electricity_unit: string | null;
  water_unit: string | null;
  parking_unit: string | null;
  garbage_unit: string | null;
  amenities: unknown;
  image_urls: string[];
  updated_at: string | null;
};

export type HousingListResponse = {
  housings: Housing[];
  limit: number;
  offset: number;
};

/** Full housing row from GET /housings/{id} (matches backend `_housing_row`). */
export type HousingDetail = {
  id: string;
  electricity_unit: string | null;
  water_unit: string | null;
  otherfee: number | null;
  parking_unit: string | null;
  room_code: string | null;
  room_id: string | null;
  price: number | null;
  house_name: string | null;
  is_allow_electric_car: string | null;
  electricity_fee: number | null;
  water_fee: number | null;
  card_fee: number | null;
  washing_machine_fee: number | null;
  parking_fee: number | null;
  garbage_fee: number | null;
  card_unit: string | null;
  garbage_unit: string | null;
  has_wifi: boolean | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  amenities: unknown;
  image_urls: string[];
  last_update: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type RoomDetail = {
  id: string;
  kitchen: boolean | null;
  desk: boolean | null;
  bed: boolean | null;
  elevator: boolean | null;
  tivi: boolean | null;
  mattress: boolean | null;
  cooling_type: string | null;
  pet: boolean | null;
  parking_space: string | null;
  toilet: string | null;
  time: string | null;
  gatelock: string | null;
  room_area: string | null;
  bancony: boolean | null;
  fridge: boolean | null;
  washer: boolean | null;
  hotwater: boolean | null;
  air_conditioner: boolean | null;
  kitchent_sink: boolean | null;
  window: boolean | null;
  drying_yard: string | null;
  wardrobe: boolean | null;
  floor: string | null;
  skylight: boolean | null;
  attic: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

export type HousingDetailResponse = {
  housing: HousingDetail;
  room: RoomDetail | null;
};
