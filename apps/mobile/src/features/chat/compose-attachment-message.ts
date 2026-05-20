import { API_MESSAGE_MAX } from "@/src/features/chat/constants";

export type PickedAttachment = {
  uri: string;
  name: string;
  kind: "image" | "document";
  mimeType?: string;
};

export type AttachmentComposeLabels = {
  imageAttachDefaultNote: string;
  binaryDocumentFallback: string;
};

async function readUriAsUtf8Text(uri: string): Promise<string | null> {
  try {
    const res = await fetch(uri);
    const buf = await res.arrayBuffer();
    if (buf.byteLength > 4 * 1024 * 1024) {
      return null;
    }
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < Math.min(bytes.length, 8000); i++) {
      if (bytes[i] === 0) {
        return null;
      }
    }
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

export async function composeOutgoingMessage(
  body: string,
  picked: PickedAttachment | null,
  labels: AttachmentComposeLabels,
): Promise<string | null> {
  const caption = body.trim();
  if (!picked) {
    return caption.length > 0 ? caption.slice(0, API_MESSAGE_MAX) : null;
  }
  if (picked.kind === "image") {
    const main = caption || labels.imageAttachDefaultNote;
    const line = `${main}\n[Image: ${picked.name}]`;
    return line.slice(0, API_MESSAGE_MAX);
  }
  const decoded = await readUriAsUtf8Text(picked.uri);
  const header = caption ? `${caption}\n\n` : "";
  if (decoded) {
    const overhead = header.length + picked.name.length + 20;
    const maxBody = Math.max(0, API_MESSAGE_MAX - overhead);
    const snippet = decoded.slice(0, maxBody);
    const block = `--- ${picked.name} ---\n${snippet}`;
    return (header + block).slice(0, API_MESSAGE_MAX);
  }
  const fallback = `${labels.binaryDocumentFallback}: ${picked.name}`;
  return (header + fallback).slice(0, API_MESSAGE_MAX);
}
