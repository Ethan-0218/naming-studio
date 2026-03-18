import { useCallback, useEffect, useState } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';

export function useAppleAuth() {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setIsAvailable);
  }, []);

  const signIn = useCallback(async (): Promise<string> => {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME],
    });
    if (!credential.identityToken) {
      throw new Error('Apple identity token을 받지 못했습니다.');
    }
    return credential.identityToken;
  }, []);

  return { isAvailable, signIn };
}
