import * as SecureStore from 'expo-secure-store';
import { UserProfile } from './AuthContext';

const TOKEN_KEY = 'auth_token';
const USER_ID_KEY = 'auth_user_id';
const PROFILE_KEY = 'auth_profile';

/** SecureStore에 저장된 레거시 JSON을 UserProfile로 정규화합니다. */
export function parseStoredProfile(raw: string): UserProfile | null {
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (!o || typeof o !== 'object') return null;
    const createdAt =
      typeof o.createdAt === 'string'
        ? o.createdAt
        : typeof o.created_at === 'string'
          ? o.created_at
          : new Date(0).toISOString();
    return {
      displayName:
        typeof o.displayName === 'string'
          ? o.displayName
          : typeof o.display_name === 'string'
            ? o.display_name
            : null,
      email: typeof o.email === 'string' ? o.email : null,
      oauthProvider:
        typeof o.oauthProvider === 'string'
          ? o.oauthProvider
          : typeof o.oauth_provider === 'string'
            ? o.oauth_provider
            : null,
      createdAt,
      isPremium: Boolean(o.isPremium ?? o.is_premium ?? false),
    };
  } catch {
    return null;
  }
}

export async function saveToken(
  token: string,
  userId: string,
  profile: UserProfile,
): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_ID_KEY, userId);
  await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(profile));
}

export async function loadToken(): Promise<{
  token: string;
  userId: string;
  profile: UserProfile | null;
} | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const userId = await SecureStore.getItemAsync(USER_ID_KEY);
  if (!token || !userId) return null;
  const profileRaw = await SecureStore.getItemAsync(PROFILE_KEY);
  const profile: UserProfile | null = profileRaw
    ? parseStoredProfile(profileRaw)
    : null;
  return { token, userId, profile };
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_ID_KEY);
  await SecureStore.deleteItemAsync(PROFILE_KEY);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}
