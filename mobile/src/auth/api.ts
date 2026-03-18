import { BACKEND_URL } from '../../constants/config';

export async function signInWithApple(
  identityToken: string,
): Promise<{ access_token: string; user_id: string }> {
  const res = await fetch(`${BACKEND_URL}/api/auth/apple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity_token: identityToken }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apple 로그인 실패: ${res.status} ${text}`);
  }

  return res.json();
}
