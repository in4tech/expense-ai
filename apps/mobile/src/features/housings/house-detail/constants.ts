export const ROOM_BOOL_KEYS = [
  "kitchen",
  "desk",
  "bed",
  "elevator",
  "tivi",
  "mattress",
  "pet",
  "bancony",
  "fridge",
  "washer",
  "hotwater",
  "air_conditioner",
  "kitchent_sink",
  "window",
  "wardrobe",
  "skylight",
  "attic",
] as const;

export type RoomBoolKey = (typeof ROOM_BOOL_KEYS)[number];

export const ROOM_STRING_KEYS = [
  "cooling_type",
  "parking_space",
  "toilet",
  "time",
  "gatelock",
  "room_area",
  "drying_yard",
  "floor",
] as const;

export type RoomStringKey = (typeof ROOM_STRING_KEYS)[number];
