export type UserProfile = {
  avatarUri: string | null;
  bio: string;
  username: string;
  phoneCountryIso: string;
  phoneNumber: string;
  address: string;
  birthDay: number | null;
  birthMonth: number | null;
  birthYear: number | null;
};

export const emptyProfile = (defaults?: Partial<UserProfile>): UserProfile => ({
  avatarUri: null,
  bio: '',
  username: '',
  phoneCountryIso: 'VN',
  phoneNumber: '',
  address: '',
  birthDay: null,
  birthMonth: null,
  birthYear: null,
  ...defaults,
});
