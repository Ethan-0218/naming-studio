import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const USER_ID_KEY = 'auth_user_id';

export async function saveToken(token: string, userId: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_ID_KEY, userId);
}

export async function loadToken(): Promise<{ token: string; userId: string } | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const userId = await SecureStore.getItemAsync(USER_ID_KEY);
  if (!token || !userId) return null;
  return { token, userId };
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_ID_KEY);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}
