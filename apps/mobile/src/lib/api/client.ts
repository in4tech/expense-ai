export const normalizeBaseUrl = (apiBaseUrl: string) => apiBaseUrl.replace(/\/$/, '');

type ApiErrorPayload = { detail?: string };

export const readApiErrorDetail = (payload: unknown, fallback: string): string => {
  if (payload && typeof payload === 'object' && 'detail' in payload) {
    const detail = (payload as ApiErrorPayload).detail;
    if (typeof detail === 'string') {
      return detail;
    }
  }
  return fallback;
};

const parseJson = async (response: Response): Promise<unknown> => {
  return (await response.json().catch(() => null)) as unknown;
};

export type CreateApiClientConfig = {
  baseUrl: string;
  /** Gắn thêm mọi request (ví dụ `Accept`, `X-Client-Version`). */
  defaultHeaders?: Record<string, string>;
  /** Chuẩn bị cho auth sau này — trả về token thì client sẽ gửi `Authorization: Bearer …`. */
  getAccessToken?: () => string | undefined;
};

export function createApiClient(config: CreateApiClientConfig) {
  const normalizedBase = normalizeBaseUrl(config.baseUrl);

  const buildUrl = (path: string) => {
    const suffix = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBase}${suffix}`;
  };

  const mergeHeaders = (initHeaders?: HeadersInit): Headers => {
    const headers = new Headers();
    if (config.defaultHeaders) {
      for (const [key, value] of Object.entries(config.defaultHeaders)) {
        headers.set(key, value);
      }
    }
    const token = config.getAccessToken?.();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (initHeaders) {
      const extra = new Headers(initHeaders);
      extra.forEach((value, key) => {
        headers.set(key, value);
      });
    }
    return headers;
  };

  /**
   * `fetch` gốc với URL đã gắn base và headers mặc định.
   * Dùng cho FormData / upload — không set `Content-Type` để RN tự gắn boundary.
   */
  const request = async (path: string, init: RequestInit = {}): Promise<Response> => {
    const url = buildUrl(path);
    const headers = mergeHeaders(init.headers);
    return fetch(url, { ...init, headers });
  };

  const throwIfJsonError = async (response: Response, path: string, fallback: string) => {
    const payload = await parseJson(response);
    if (!response.ok) {
      throw new Error(readApiErrorDetail(payload, `${fallback} (${response.status}).`));
    }
    return payload;
  };

  const get = async <T>(path: string, fallbackMessage: string): Promise<T> => {
    const response = await request(path, { method: 'GET' });
    const payload = await throwIfJsonError(response, path, fallbackMessage);
    return payload as T;
  };

  const post = async <T>(path: string, body: unknown, fallbackMessage: string): Promise<T> => {
    const response = await request(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = await throwIfJsonError(response, path, fallbackMessage);
    return payload as T;
  };

  return {
    baseUrl: normalizedBase,
    buildUrl,
    request,
    get,
    post,
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
