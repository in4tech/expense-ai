import { apiPaths, type ApiClient } from "@/src/api";

import type { Housing, HousingListResponse } from "@/src/features/housings/types";

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
      amenities: null,
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
    amenities: item.amenities ?? null,
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
