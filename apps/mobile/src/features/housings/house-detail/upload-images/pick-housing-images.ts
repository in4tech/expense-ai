import * as ImagePicker from "expo-image-picker";

import type { PendingHousingImage } from "@/src/features/housings/house-detail/upload-images/types";

export type PickHousingImagesResult =
  | { ok: true; images: PendingHousingImage[] }
  | { ok: false; reason: "permission_denied" | "canceled" };

let pickIdCounter = 0;

const toPendingImage = (asset: ImagePicker.ImagePickerAsset, index: number): PendingHousingImage => {
  pickIdCounter += 1;
  return {
    id: `pick-${pickIdCounter}-${index}`,
    uri: asset.uri,
    name: asset.fileName ?? `image-${index + 1}.jpg`,
    mimeType: asset.mimeType ?? "image/jpeg",
  };
};

export const pickHousingImagesFromLibrary = async (): Promise<PickHousingImagesResult> => {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    return { ok: false, reason: "permission_denied" };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    quality: 0.85,
  });

  if (result.canceled || result.assets.length === 0) {
    return { ok: false, reason: "canceled" };
  }

  return {
    ok: true,
    images: result.assets.map(toPendingImage),
  };
};
