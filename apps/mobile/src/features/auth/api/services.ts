import { apiPaths, type ApiClient } from '@/src/api';
import type {
  AuthCredentials,
  AuthUser,
  LoginResponse,
  LogoutResponse,
  RefreshResponse,
  RegisterResponse,
} from '@/src/features/auth/types';

export const register = (client: ApiClient, credentials: AuthCredentials) =>
  client.post<RegisterResponse>(
    apiPaths.auth.register,
    credentials,
    'Registration failed',
  );

export const login = (client: ApiClient, credentials: AuthCredentials) =>
  client.post<LoginResponse>(apiPaths.auth.login, credentials, 'Sign in failed');

export const refreshAccessToken = (client: ApiClient, refreshToken: string) =>
  client.post<RefreshResponse>(
    apiPaths.auth.refresh,
    { refresh_token: refreshToken },
    'Session refresh failed',
  );

export const logout = (client: ApiClient) =>
  client.post<LogoutResponse>(apiPaths.auth.logout, {}, 'Logout failed');

export const getMe = (client: ApiClient) =>
  client.get<AuthUser>(apiPaths.auth.me, 'Could not load profile');
