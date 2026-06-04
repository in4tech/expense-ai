import { apiPaths, type ApiClient } from "@/src/api";

import type { Housing, HousingDetail, HousingDetailResponse, HousingListResponse, RoomDetail } from "@/src/features/housings/types";

const toNullableNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const toNullableString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const parseStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
};

const toNullableBoolean = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return null;
};

const parseHousingRow = (row: unknown): Housing => {
  if (!row || typeof row !== "object") {
    return {
      id: "",
      house_name: null,
      room_code: null,
      price: null,
      address: null,
      has_wifi: null,
      room_id: null,
      electricity_fee: null,
      water_fee: null,
      parking_fee: null,
      garbage_fee: null,
      electricity_unit: null,
      water_unit: null,
      parking_unit: null,
      garbage_unit: null,
      amenities: null,
      image_urls: [],
      updated_at: null,
    };
  }

  const item = row as Record<string, unknown>;
  return {
    id: String(item.id ?? ""),
    house_name: toNullableString(item.house_name),
    room_code: toNullableString(item.room_code),
    price: toNullableNumber(item.price),
    address: toNullableString(item.address),
    has_wifi: toNullableBoolean(item.has_wifi),
    room_id: toNullableString(item.room_id),
    electricity_fee: toNullableNumber(item.electricity_fee),
    water_fee: toNullableNumber(item.water_fee),
    parking_fee: toNullableNumber(item.parking_fee),
    garbage_fee: toNullableNumber(item.garbage_fee),
    electricity_unit: toNullableString(item.electricity_unit),
    water_unit: toNullableString(item.water_unit),
    parking_unit: toNullableString(item.parking_unit),
    garbage_unit: toNullableString(item.garbage_unit),
    amenities: item.amenities ?? null,
    image_urls: parseStringArray(item.image_urls),
    updated_at: toNullableString(item.updated_at),
  };
};

const parseHousingDetail = (row: unknown): HousingDetail => {
  if (!row || typeof row !== "object") {
    return {
      id: "",
      electricity_unit: null,
      water_unit: null,
      otherfee: null,
      parking_unit: null,
      room_code: null,
      room_id: null,
      price: null,
      house_name: null,
      is_allow_electric_car: null,
      electricity_fee: null,
      water_fee: null,
      card_fee: null,
      washing_machine_fee: null,
      parking_fee: null,
      garbage_fee: null,
      card_unit: null,
      garbage_unit: null,
      has_wifi: null,
      address: null,
      latitude: null,
      longitude: null,
      amenities: null,
      image_urls: [],
      last_update: null,
      created_at: null,
      updated_at: null,
    };
  }
  const item = row as Record<string, unknown>;
  return {
    id: String(item.id ?? ""),
    electricity_unit: toNullableString(item.electricity_unit),
    water_unit: toNullableString(item.water_unit),
    otherfee: toNullableNumber(item.otherfee),
    parking_unit: toNullableString(item.parking_unit),
    room_code: toNullableString(item.room_code),
    room_id: toNullableString(item.room_id),
    price: toNullableNumber(item.price),
    house_name: toNullableString(item.house_name),
    is_allow_electric_car: toNullableString(item.is_allow_electric_car),
    electricity_fee: toNullableNumber(item.electricity_fee),
    water_fee: toNullableNumber(item.water_fee),
    card_fee: toNullableNumber(item.card_fee),
    washing_machine_fee: toNullableNumber(item.washing_machine_fee),
    parking_fee: toNullableNumber(item.parking_fee),
    garbage_fee: toNullableNumber(item.garbage_fee),
    card_unit: toNullableString(item.card_unit),
    garbage_unit: toNullableString(item.garbage_unit),
    has_wifi: toNullableBoolean(item.has_wifi),
    address: toNullableString(item.address),
    latitude: toNullableNumber(item.latitude),
    longitude: toNullableNumber(item.longitude),
    amenities: item.amenities ?? null,
    image_urls: parseStringArray(item.image_urls),
    last_update: toNullableString(item.last_update),
    created_at: toNullableString(item.created_at),
    updated_at: toNullableString(item.updated_at),
  };
};

const parseRoomDetail = (row: unknown): RoomDetail | null => {
  if (!row || typeof row !== "object") return null;
  const item = row as Record<string, unknown>;
  return {
    id: String(item.id ?? ""),
    kitchen: toNullableBoolean(item.kitchen),
    desk: toNullableBoolean(item.desk),
    bed: toNullableBoolean(item.bed),
    elevator: toNullableBoolean(item.elevator),
    tivi: toNullableBoolean(item.tivi),
    mattress: toNullableBoolean(item.mattress),
    cooling_type: toNullableString(item.cooling_type),
    pet: toNullableBoolean(item.pet),
    parking_space: toNullableString(item.parking_space),
    toilet: toNullableString(item.toilet),
    time: toNullableString(item.time),
    gatelock: toNullableString(item.gatelock),
    room_area: toNullableString(item.room_area),
    bancony: toNullableBoolean(item.bancony),
    fridge: toNullableBoolean(item.fridge),
    washer: toNullableBoolean(item.washer),
    hotwater: toNullableBoolean(item.hotwater),
    air_conditioner: toNullableBoolean(item.air_conditioner),
    kitchent_sink: toNullableBoolean(item.kitchent_sink),
    window: toNullableBoolean(item.window),
    drying_yard: toNullableString(item.drying_yard),
    wardrobe: toNullableBoolean(item.wardrobe),
    floor: toNullableString(item.floor),
    skylight: toNullableBoolean(item.skylight),
    attic: toNullableBoolean(item.attic),
    created_at: toNullableString(item.created_at),
    updated_at: toNullableString(item.updated_at),
  };
};

export const listHousings = async (
  client: ApiClient,
  limit = 40,
  offset = 0,
): Promise<HousingListResponse> => {
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  }).toString();
  const path = `${apiPaths.housings.root}?${query}`;
  const payload = await client.get<unknown>(path, "Housing list failed");

  if (!payload || typeof payload !== "object" || !("housings" in payload)) {
    throw new Error("Invalid housing list response.");
  }

  const rawHousings = (payload as { housings: unknown }).housings;
  if (!Array.isArray(rawHousings)) {
    throw new Error("Invalid housing list response.");
  }

  return {
    housings: rawHousings.map(parseHousingRow),
    limit:
      typeof (payload as { limit?: unknown }).limit === "number"
        ? (payload as unknown as { limit: number }).limit
        : limit,
    offset:
      typeof (payload as { offset?: unknown }).offset === "number"
        ? (payload as unknown as { offset: number }).offset
        : offset,
  };
};

export const getHousingById = async (client: ApiClient, housingId: string): Promise<HousingDetailResponse> => {
  const path = apiPaths.housings.byId(housingId);
  const payload = await client.get<unknown>(path, "Housing detail failed");

  if (!payload || typeof payload !== "object" || !("housing" in payload)) {
    throw new Error("Invalid housing detail response.");
  }

  const housingRaw = (payload as { housing: unknown }).housing;
  const roomRaw = (payload as { room?: unknown }).room;

  return {
    housing: parseHousingDetail(housingRaw),
    room: roomRaw == null ? null : parseRoomDetail(roomRaw),
  };
};
