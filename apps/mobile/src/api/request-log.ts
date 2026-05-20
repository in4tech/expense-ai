const MAX_BODY_CHARS = 4096;

const truncate = (text: string): string =>
  text.length > MAX_BODY_CHARS ? `${text.slice(0, MAX_BODY_CHARS)}… (${text.length} chars)` : text;

export const headersToLogRecord = (headers: Headers): Record<string, string> => {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === 'authorization' || lower === 'cookie') {
      out[key] = '[REDACTED]';
    } else {
      out[key] = value;
    }
  });
  return out;
};

export const summarizeRequestBodyForLog = (body: RequestInit['body'] | undefined): string => {
  if (body == null || body === '') {
    return '(no body)';
  }
  if (typeof body === 'string') {
    return truncate(body);
  }
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    return '(multipart/form-data)';
  }
  return `(non-string body: ${Object.prototype.toString.call(body)})`;
};

export const readResponseBodyForLog = async (response: Response): Promise<string> => {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('text/event-stream')) {
    return '(event-stream — body not buffered here)';
  }
  try {
    const clone = response.clone();
    const text = await clone.text();
    if (!text) {
      return '(empty)';
    }
    return truncate(text);
  } catch {
    return '(could not read body)';
  }
};

export const resolveApiRequestLogging = (explicit?: boolean): boolean => {
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_DEBUG === '0') {
    return false;
  }
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_DEBUG === '1') {
    return true;
  }
  if (explicit != null) {
    return explicit;
  }
  return typeof __DEV__ !== 'undefined' && __DEV__;
};
