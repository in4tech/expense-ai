import type { Housing } from "@/src/features/housings/types";

export type HomeListingsTab = "all" | "popular" | "recommendation";

export type HomeListingsSnapshot = {
  housings: Housing[];
  initialTab?: HomeListingsTab;
};

let snapshot: HomeListingsSnapshot | null = null;

export function setHomeListingsSnapshot(data: HomeListingsSnapshot) {
  snapshot = data;
}

export function consumeHomeListingsSnapshot(): HomeListingsSnapshot | null {
  const value = snapshot;
  snapshot = null;
  return value;
}
