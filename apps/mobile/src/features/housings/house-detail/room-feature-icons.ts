import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

import type { RoomBoolKey, RoomStringKey } from "@/src/features/housings/house-detail/constants";

export type RoomFeatureIcon = ComponentProps<typeof Ionicons>["name"];

export const ROOM_BOOL_ICONS: Record<RoomBoolKey, RoomFeatureIcon> = {
  kitchen: "restaurant-outline",
  desk: "desktop-outline",
  bed: "bed-outline",
  elevator: "arrow-up-outline",
  tivi: "tv-outline",
  mattress: "layers-outline",
  pet: "paw-outline",
  bancony: "sunny-outline",
  fridge: "snow-outline",
  washer: "shirt-outline",
  hotwater: "flame-outline",
  air_conditioner: "snow-outline",
  kitchent_sink: "water-outline",
  window: "square-outline",
  wardrobe: "file-tray-stacked-outline",
  skylight: "partly-sunny-outline",
  attic: "home-outline",
};

export const ROOM_STRING_ICONS: Record<RoomStringKey, RoomFeatureIcon> = {
  cooling_type: "thermometer-outline",
  parking_space: "car-outline",
  toilet: "water-outline",
  time: "time-outline",
  gatelock: "lock-closed-outline",
  room_area: "resize-outline",
  drying_yard: "sunny-outline",
  floor: "layers-outline",
};
