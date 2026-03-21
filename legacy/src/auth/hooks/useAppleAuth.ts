import { useCallback, useEffect, useState } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';

export interface AppleCredential {
  identityToken: string;
  fullName: string | null;
  email: string | null;
}

export function useAppleAuth() {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setIsAvailable);
  }, []);

  const signIn = useCallback(async (): Promise<AppleCredential> => {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) {
      throw new Error('Apple identity token을 받지 못했습니다.');
    }
    const fullName = credential.fullName
      ? [credential.fullName.familyName, credential.fullName.givenName]
          .filter(Boolean)
          .join('')
      : null;
    return {
      identityToken: credential.identityToken,
      fullName,
      email: credential.email ?? null,
    };
  }, []);

  return { isAvailable, signIn };
}
