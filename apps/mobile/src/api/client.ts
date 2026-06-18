import {
  headersToLogRecord,
  readResponseBodyForLog,
  resolveApiRequestLogging,
  summarizeRequestBodyForLog,
} from '@/src/api/request-log';

export const normalizeBaseUrl = (apiBaseUrl: string) => apiBaseUrl.replace(/\/$/, '');

const AUTH_PATHS_WITHOUT_SESSION = new Set(['/auth/login', '/auth/register']);

const shouldHandleUnauthorized = (path: string) => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return !AUTH_PATHS_WITHOUT_SESSION.has(normalized);
};

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
  defaultHeaders?: Record<string, string>;
  getAccessToken?: () => string | undefined;
  enableRequestLogging?: boolean;
  /** Return true when the session was refreshed and the request may be retried. */
  onUnauthorized?: (path: string) => boolean | Promise<boolean>;
};

export function createApiClient(config: CreateApiClientConfig) {
  const normalizedBase = normalizeBaseUrl(config.baseUrl);
  const logRequests = resolveApiRequestLogging(config.enableRequestLogging);

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

  const request = async (
    path: string,
    init: RequestInit = {},
    isRetry = false,
  ): Promise<Response> => {
    const url = buildUrl(path);
    const headers = mergeHeaders(init.headers);
    const method = (init.method ?? 'GET').toUpperCase();

    if (logRequests) {
      console.log(`[API] → ${method} ${url}`);
      console.log('[API]   headers', headersToLogRecord(headers));
      console.log('[API]   body', summarizeRequestBodyForLog(init.body));
    }

    const started = logRequests ? Date.now() : 0;
    let response: Response;
    try {
      response = await fetch(url, { ...init, headers });
    } catch (error) {
      if (logRequests) {
        console.log(`[API] ✖ ${method} ${url} network error`, error);
      }
      throw error;
    }

    if (
      response.status === 401 &&
      !isRetry &&
      config.onUnauthorized &&
      shouldHandleUnauthorized(path)
    ) {
      const recovered = await config.onUnauthorized(path);
      if (recovered) {
        return request(path, init, true);
      }
    }

    if (logRequests) {
      const ms = Date.now() - started;
      const bodyPreview = await readResponseBodyForLog(response);
      console.log(`[API] ← ${method} ${url} ${response.status} ${response.statusText} (${ms}ms)`);
      console.log('[API]   body', bodyPreview);
    }

    return response;
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
