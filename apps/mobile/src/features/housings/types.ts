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
  amenities: unknown;
};

export type HousingListResponse = {
  housings: Housing[];
  limit: number;
  offset: number;
};
