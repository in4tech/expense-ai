export type HomeHousingFilters = {
  hasPhotos: boolean;
  hasWifi: boolean;
  hasPrice: boolean;
  hasAddress: boolean;
  hasParking: boolean;
};

export const EMPTY_HOME_HOUSING_FILTERS: HomeHousingFilters = {
  hasPhotos: false,
  hasWifi: false,
  hasPrice: false,
  hasAddress: false,
  hasParking: false,
};

export function countActiveHomeFilters(filters: HomeHousingFilters): number {
  return Object.values(filters).filter(Boolean).length;
}
