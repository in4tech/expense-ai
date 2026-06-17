import { apiPaths, readApiErrorDetail, type ApiClient } from "@/src/api";

export type ImageCaptionFile = {
  uri: string;
  name: string;
  mimeType?: string;
};

export type CaptionPredictResponse = {
  caption: string;
};

export const predictImageCaption = async (
  client: ApiClient,
  file: ImageCaptionFile,
): Promise<CaptionPredictResponse> => {
  const path = apiPaths.imageCaptioning.predict;
  const form = new FormData();
  form.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || "image/jpeg",
  } as unknown as Blob);

  const response = await client.request(path, {
    method: "POST",
    body: form,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      readApiErrorDetail(payload, `Image caption prediction failed (${response.status}).`),
    );
  }
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid image caption response.");
  }

  const caption = (payload as Record<string, unknown>).caption;
  if (typeof caption !== "string") {
    throw new Error("Invalid image caption response.");
  }

  return { caption };
};
