import type { Housing } from "@/src/features/housings/types";

import { HOME_POPULAR_PREVIEW_LIMIT } from "../constants";

const popularScore = (housing: Housing) => {
  let score = 0;
  if (housing.image_urls.length > 0) {
    score += 4;
  }
  if (housing.price != null) {
    score += 2;
  }
  if (housing.address) {
    score += 1;
  }
  return score;
};

export function sortHousingsByPopularity(housings: Housing[]): Housing[] {
  return [...housings].sort((a, b) => popularScore(b) - popularScore(a));
}

export function pickPopularHousings(
  housings: Housing[],
  limit = HOME_POPULAR_PREVIEW_LIMIT,
): Housing[] {
  if (housings.length === 0) {
    return [];
  }

  return sortHousingsByPopularity(housings).slice(0, limit);
}
