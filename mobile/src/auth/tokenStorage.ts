import * as SecureStore from 'expo-secure-store';
import { UserProfile } from './AuthContext';

const TOKEN_KEY = 'auth_token';
const USER_ID_KEY = 'auth_user_id';
const PROFILE_KEY = 'auth_profile';

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
    ? JSON.parse(profileRaw)
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
