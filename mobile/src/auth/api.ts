import { BACKEND_URL } from '../../constants/config';
import { UserProfile } from './AuthContext';

export async function signInWithApple(
  identityToken: string,
  fullName?: string | null,
  email?: string | null,
): Promise<{ access_token: string; user_id: string; profile: UserProfile }> {
  const res = await fetch(`${BACKEND_URL}/api/auth/apple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identity_token: identityToken,
      full_name: fullName ?? null,
      email: email ?? null,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apple 로그인 실패: ${res.status} ${text}`);
  }

  const data = await res.json();
  const profile: UserProfile = {
    displayName: data.display_name ?? null,
    email: data.email ?? null,
    oauthProvider: data.oauth_provider ?? 'apple',
    createdAt: data.created_at,
  };
  return { access_token: data.access_token, user_id: data.user_id, profile };
}

export async function fetchUserProfile(token: string): Promise<UserProfile> {
  const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`프로필 조회 실패: ${res.status}`);
  }

  const data = await res.json();
  return {
    displayName: data.display_name ?? null,
    email: data.email ?? null,
    oauthProvider: data.oauth_provider ?? null,
    createdAt: data.created_at,
  };
}
