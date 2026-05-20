export type LocationPickResult = {
  address: string;
  latitude: number;
  longitude: number;
};

type Listener = (result: LocationPickResult) => void;

let listener: Listener | null = null;

export function subscribeLocationPick(listenerFn: Listener): () => void {
  listener = listenerFn;
  return () => {
    listener = null;
  };
}

export function emitLocationPick(result: LocationPickResult): void {
  listener?.(result);
}
