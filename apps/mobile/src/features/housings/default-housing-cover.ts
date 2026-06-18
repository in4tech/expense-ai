/** Unsplash photo IDs — apartments, rooms, and house exteriors only. */
const HOUSING_COVER_PHOTO_IDS = [
  "1560448204-e02f11c3d0e2", // apartment living room
  "1522708323590-d24dbb6b0267", // bright apartment interior
  "1502672260266-1c1ef2d93688", // apartment kitchen & living
  "1484154218962-a197022b5858", // cozy living room
  "1560185127-5ed4c0cc0f64", // bedroom
  "1493809842364-78817add7ffb", // open living space
  "1600596542815-ffad4c1539a9", // house exterior
  "1600607687939-ce8a6c25118c", // modern home interior
] as const;

const buildHousingCoverUrl = (
  photoId: (typeof HOUSING_COVER_PHOTO_IDS)[number],
  width: number,
  height: number,
) =>
  `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;

/** Stable cover image when a listing has no uploaded photos yet. */
export function getDefaultHousingCoverUri(
  housingId: string | number,
  width = 800,
  height = 600,
): string {
  const seed = String(housingId).trim() || "housing";
  const index =
    seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    HOUSING_COVER_PHOTO_IDS.length;
  return buildHousingCoverUrl(HOUSING_COVER_PHOTO_IDS[index], width, height);
}
