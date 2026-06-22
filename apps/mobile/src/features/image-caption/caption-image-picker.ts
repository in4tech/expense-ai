import * as ImagePicker from "expo-image-picker";

export const captionImagePickerOptions: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  quality: 0.85,
  preferredAssetRepresentationMode:
    ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
};

export type CaptionPickedAsset = {
  uri: string;
  name: string;
  mimeType: string;
};

export const toCaptionPickedAsset = (
  asset: ImagePicker.ImagePickerAsset,
): CaptionPickedAsset => {
  const mimeType = asset.mimeType?.toLowerCase() ?? "image/jpeg";
  const isJpeg =
    mimeType.includes("jpeg") ||
    mimeType.includes("jpg") ||
    mimeType === "image/pjpeg";

  const fallbackName = `photo-${Date.now()}.jpg`;
  const rawName = asset.fileName ?? fallbackName;
  const name = isJpeg
    ? rawName
    : rawName.includes(".")
      ? rawName.replace(/\.[^.]+$/i, ".jpg")
      : `${rawName}.jpg`;

  return {
    uri: asset.uri,
    name,
    mimeType: isJpeg ? mimeType : "image/jpeg",
  };
};
