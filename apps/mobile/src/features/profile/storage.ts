import * as SecureStore from 'expo-secure-store';

import { resolveCountryIso } from '@/src/features/profile/country-codes';
import { emptyProfile, type UserProfile } from '@/src/features/profile/types';

type StoredProfile = Partial<UserProfile> & {
  phoneCountryCode?: string;
};

function normalizeStoredProfile(parsed: StoredProfile): UserProfile {
  const { phoneCountryCode, phoneCountryIso, ...rest } = parsed;
  const iso = phoneCountryIso ?? (phoneCountryCode ? resolveCountryIso(phoneCountryCode) : undefined);
  return emptyProfile({ ...rest, phoneCountryIso: iso });
}

const profileKey = (userId: string) => `expense_ai_profile_${userId}`;

export async function loadProfile(userId: string): Promise<UserProfile> {
  const raw = await SecureStore.getItemAsync(profileKey(userId));
  if (!raw) {
    return emptyProfile();
  }
  try {
    const parsed = JSON.parse(raw) as StoredProfile;
    return normalizeStoredProfile(parsed);
  } catch {
    return emptyProfile();
  }
}

export async function saveProfile(userId: string, profile: UserProfile): Promise<void> {
  await SecureStore.setItemAsync(profileKey(userId), JSON.stringify(profile));
}

export async function clearProfile(userId: string): Promise<void> {
  await SecureStore.deleteItemAsync(profileKey(userId));
}
