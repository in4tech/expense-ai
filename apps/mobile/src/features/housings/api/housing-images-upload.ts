import { apiPaths, readApiErrorDetail, type ApiClient } from "@/src/api";

export type HousingImageFile = {
  uri: string;
  name: string;
  mimeType?: string;
};

export type UploadHousingImagesResponse = {
  total: number;
  images: string[];
};

export const uploadHousingImages = async (
  client: ApiClient,
  housingId: string,
  files: HousingImageFile[],
): Promise<UploadHousingImagesResponse> => {
  if (files.length === 0) {
    throw new Error("At least one image is required.");
  }

  const path = apiPaths.housings.uploadImages(housingId);
  const form = new FormData();
  for (const file of files) {
    form.append("files", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || "image/jpeg",
    } as unknown as Blob);
  }

  const response = await client.request(path, {
    method: "POST",
    body: form,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      readApiErrorDetail(payload, `Upload images failed (${response.status}).`),
    );
  }
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid upload images response.");
  }

  const row = payload as Record<string, unknown>;
  const images = Array.isArray(row.images)
    ? row.images.filter((url): url is string => typeof url === "string")
    : [];

  return {
    total: typeof row.total === "number" ? row.total : images.length,
    images,
  };
};
