import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { DEFAULT_API_BASE_URL } from '@/src/config/env';
import {
  getMe,
  login as loginRequest,
  logout as logoutRequest,
  refreshAccessToken,
  register as registerRequest,
} from '@/src/features/auth/api';
import {
  clearStoredTokens,
  loadStoredTokens,
  saveAccessToken,
  saveTokens,
} from '@/src/features/auth/session';
import type { AuthCredentials, AuthUser } from '@/src/features/auth/types';
import { createApiClient, type ApiClient } from '@/src/api';

type AuthContextValue = {
  isReady: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => void;
  getAccessToken: () => string | undefined;
  getApiClient: () => ApiClient;
  signIn: (credentials: AuthCredentials) => Promise<void>;
  signUp: (credentials: AuthCredentials) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const accessTokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);
  const unauthorizedHandlingRef = useRef<Promise<boolean> | null>(null);

  const getAccessToken = useCallback(
    () => accessTokenRef.current ?? undefined,
    [],
  );

  const applySession = useCallback(
    async (accessToken: string, refreshToken: string) => {
      accessTokenRef.current = accessToken;
      refreshTokenRef.current = refreshToken;
      await saveTokens(accessToken, refreshToken);
      const client = createApiClient({
        baseUrl: apiBaseUrl,
        getAccessToken: () => accessToken,
      });
      const profile = await getMe(client);
      setUser(profile);
    },
    [apiBaseUrl],
  );

  const clearSession = useCallback(async () => {
    accessTokenRef.current = null;
    refreshTokenRef.current = null;
    setUser(null);
    await clearStoredTokens();
    queryClient.clear();
  }, [queryClient]);

  const tryRefreshSession = useCallback(async (): Promise<boolean> => {
    const refreshToken = refreshTokenRef.current;
    if (!refreshToken) {
      return false;
    }
    const client = createApiClient({ baseUrl: apiBaseUrl });
    try {
      const { access_token } = await refreshAccessToken(client, refreshToken);
      accessTokenRef.current = access_token;
      await saveAccessToken(access_token);
      const authedClient = createApiClient({
        baseUrl: apiBaseUrl,
        getAccessToken: () => access_token,
      });
      const profile = await getMe(authedClient);
      setUser(profile);
      return true;
    } catch {
      return false;
    }
  }, [apiBaseUrl]);

  const handleUnauthorized = useCallback(async (): Promise<boolean> => {
    if (unauthorizedHandlingRef.current) {
      return unauthorizedHandlingRef.current;
    }

    const handling = (async () => {
      const refreshed = await tryRefreshSession();
      if (!refreshed) {
        await clearSession();
      }
      return refreshed;
    })();

    unauthorizedHandlingRef.current = handling;
    try {
      return await handling;
    } finally {
      unauthorizedHandlingRef.current = null;
    }
  }, [clearSession, tryRefreshSession]);

  const getApiClient = useCallback(() => {
    return createApiClient({
      baseUrl: apiBaseUrl,
      getAccessToken: () => accessTokenRef.current ?? undefined,
      onUnauthorized: () => handleUnauthorized(),
    });
  }, [apiBaseUrl, handleUnauthorized]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const { accessToken, refreshToken } = await loadStoredTokens();
        if (!accessToken || !refreshToken) {
          return;
        }
        accessTokenRef.current = accessToken;
        refreshTokenRef.current = refreshToken;
        const client = createApiClient({
          baseUrl: apiBaseUrl,
          getAccessToken: () => accessToken,
        });
        try {
          const profile = await getMe(client);
          if (!cancelled) {
            setUser(profile);
          }
        } catch {
          const refreshed = await tryRefreshSession();
          if (!refreshed && !cancelled) {
            await clearSession();
          }
        }
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, clearSession, tryRefreshSession]);

  const signIn = useCallback(
    async (credentials: AuthCredentials) => {
      const client = createApiClient({ baseUrl: apiBaseUrl });
      const tokens = await loginRequest(client, credentials);
      await applySession(tokens.access_token, tokens.refresh_token);
    },
    [apiBaseUrl, applySession],
  );

  const signUp = useCallback(
    async (credentials: AuthCredentials) => {
      const client = createApiClient({ baseUrl: apiBaseUrl });
      await registerRequest(client, credentials);
      const tokens = await loginRequest(client, credentials);
      await applySession(tokens.access_token, tokens.refresh_token);
    },
    [apiBaseUrl, applySession],
  );

  const signOut = useCallback(async () => {
    const token = accessTokenRef.current;
    if (token) {
      try {
        const client = createApiClient({
          baseUrl: apiBaseUrl,
          getAccessToken: () => token,
        });
        await logoutRequest(client);
      } catch {
        // Clear local session even if the server logout fails.
      }
    }
    await clearSession();
  }, [apiBaseUrl, clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      isAuthenticated: user != null,
      user,
      apiBaseUrl,
      setApiBaseUrl,
      getAccessToken,
      getApiClient,
      signIn,
      signUp,
      signOut,
    }),
    [
      isReady,
      user,
      apiBaseUrl,
      getAccessToken,
      getApiClient,
      signIn,
      signUp,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
