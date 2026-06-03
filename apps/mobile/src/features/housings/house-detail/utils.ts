import type { HousingDetail } from "@/src/features/housings/types";

const VND = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export const formatVndPrice = (price: number) => VND.format(price);

export const feeText = (fee: number | null) => {
  if (fee == null) return "—";
  return VND.format(fee);
};

export const formatListingFee = (fee: number | null, freeLabel = "Free") => {
  if (fee == null) return "—";
  if (fee <= 0) return freeLabel;
  return VND.format(fee);
};

export const formatListingPrice = (price: number | null, contactLabel: string) => {
  if (price == null) return contactLabel;
  return VND.format(price);
};

export const getHousingCoords = (housing: HousingDetail | undefined) => {
  const lat = housing?.latitude;
  const lng = housing?.longitude;
  if (lat == null || lng == null) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { latitude: lat, longitude: lng };
};

export const formatAmenitiesDescription = (raw: unknown): string | null => {
  if (raw == null) return null;

  const joinItems = (items: string[]) => (items.length > 0 ? items.join("\n") : null);

  if (Array.isArray(raw)) {
    return joinItems(raw.map((item) => String(item).trim()).filter(Boolean));
  }

  if (typeof raw === "string") {
    const text = raw.trim();
    if (!text) return null;

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return joinItems(parsed.map((item) => String(item).trim()).filter(Boolean));
      }
    } catch {
      return text;
    }

    return text;
  }

  return String(raw);
};
