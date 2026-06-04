import {
  countActiveHomeFilters,
  EMPTY_HOME_HOUSING_FILTERS,
  matchesHomePriceRange,
  type HomeHousingFilters,
} from "@/src/features/housings/home/types/home-filters";
import type { Housing } from "@/src/features/housings/types";

export type { HomeHousingFilters };
export { EMPTY_HOME_HOUSING_FILTERS, countActiveHomeFilters };

function hasParkingInfo(housing: Housing): boolean {
  return (
    housing.parking_fee != null || Boolean(housing.parking_unit?.trim())
  );
}

function matchesFilters(housing: Housing, filters: HomeHousingFilters): boolean {
  if (
    filters.priceRanges.length > 0 &&
    !filters.priceRanges.some((range) =>
      matchesHomePriceRange(housing.price, range),
    )
  ) {
    return false;
  }
  if (filters.hasPhotos && housing.image_urls.length === 0) {
    return false;
  }
  if (filters.hasWifi && housing.has_wifi !== true) {
    return false;
  }
  if (filters.hasParking && !hasParkingInfo(housing)) {
    return false;
  }
  return true;
}

export function filterHousings(
  housings: Housing[],
  query: string,
  filters: HomeHousingFilters = EMPTY_HOME_HOUSING_FILTERS,
): Housing[] {
  let result = housings;

  if (countActiveHomeFilters(filters) > 0) {
    result = result.filter((housing) => matchesFilters(housing, filters));
  }

  const q = query.trim().toLowerCase();
  if (!q) {
    return result;
  }

  return result.filter((housing) => {
    const name = (housing.house_name ?? "").toLowerCase();
    const code = (housing.room_code ?? "").toLowerCase();
    const address = (housing.address ?? "").toLowerCase();
    const price = housing.price != null ? String(housing.price) : "";
    return (
      name.includes(q) ||
      code.includes(q) ||
      address.includes(q) ||
      price.includes(q)
    );
  });
}
