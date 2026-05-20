export type AuthCredentials = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  email: string;
};

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
};

export type RefreshResponse = {
  access_token: string;
};

export type RegisterResponse = {
  message: string;
};

export type LogoutResponse = {
  message: string;
};
