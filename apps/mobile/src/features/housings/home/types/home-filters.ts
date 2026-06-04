/** Monthly rent buckets (VND), common on VN rental listing sites. */
export type HomePriceRange = "under3m" | "3to5m" | "5to7m" | "7to10m" | "above10m";

export const HOME_PRICE_RANGES: HomePriceRange[] = [
  "under3m",
  "3to5m",
  "5to7m",
  "7to10m",
  "above10m",
];

export const HOME_PRICE_RANGE_BOUNDS: Record<
  HomePriceRange,
  { min: number; max: number | null }
> = {
  under3m: { min: 0, max: 3_000_000 },
  "3to5m": { min: 3_000_000, max: 5_000_000 },
  "5to7m": { min: 5_000_000, max: 7_000_000 },
  "7to10m": { min: 7_000_000, max: 10_000_000 },
  above10m: { min: 10_000_000, max: null },
};

export type HomeAmenityFilter = "hasWifi" | "hasParking" | "hasPhotos";

export const HOME_AMENITY_FILTERS: HomeAmenityFilter[] = [
  "hasWifi",
  "hasParking",
  "hasPhotos",
];

export type HomeHousingFilters = {
  priceRanges: HomePriceRange[];
  hasWifi: boolean;
  hasParking: boolean;
  hasPhotos: boolean;
};

export const EMPTY_HOME_HOUSING_FILTERS: HomeHousingFilters = {
  priceRanges: [],
  hasWifi: false,
  hasParking: false,
  hasPhotos: false,
};

export function countActiveHomeFilters(filters: HomeHousingFilters): number {
  return (
    filters.priceRanges.length +
    HOME_AMENITY_FILTERS.filter((key) => filters[key]).length
  );
}

export function matchesHomePriceRange(
  price: number | null,
  range: HomePriceRange,
): boolean {
  if (price == null || price <= 0) {
    return false;
  }
  const { min, max } = HOME_PRICE_RANGE_BOUNDS[range];
  if (range === "under3m") {
    return price < (max ?? min);
  }
  if (price < min) {
    return false;
  }
  if (max != null && price > max) {
    return false;
  }
  return true;
}
