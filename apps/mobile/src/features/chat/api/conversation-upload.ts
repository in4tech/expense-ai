import { apiPaths, readApiErrorDetail, type ApiClient } from "@/src/api";

export type UploadPdfFile = {
  uri: string;
  name: string;
  mimeType?: string;
};

export type UploadPdfResponse = {
  message: string;
  chunks: number;
};

export const uploadConversationPdf = async (
  client: ApiClient,
  conversationId: string,
  file: UploadPdfFile,
  message?: string,
): Promise<UploadPdfResponse> => {
  const path = apiPaths.conversations.uploadPdf(conversationId);
  const form = new FormData();
  form.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || "application/pdf",
  } as unknown as Blob);
  const trimmedMessage = (message ?? "").trim();
  if (trimmedMessage.length > 0) {
    form.append("message", trimmedMessage);
  }

  const response = await client.request(path, {
    method: "POST",
    body: form,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      readApiErrorDetail(payload, `Upload PDF failed (${response.status}).`),
    );
  }
  if (
    !payload ||
    typeof payload !== "object" ||
    typeof (payload as Record<string, unknown>).message !== "string"
  ) {
    throw new Error("Invalid upload PDF response.");
  }
  return {
    message: String((payload as Record<string, unknown>).message),
    chunks: Number((payload as Record<string, unknown>).chunks ?? 0),
  };
};
