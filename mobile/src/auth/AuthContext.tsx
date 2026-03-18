import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { clearToken, loadToken, saveToken } from './tokenStorage';

interface AuthState {
  token: string | null;
  userId: string | null;
  isLoading: boolean;
}

interface AuthContextValue {
  auth: AuthState;
  setAuth: (token: string, userId: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  auth: { token: null, userId: null, isLoading: true },
  setAuth: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuthState] = useState<AuthState>({
    token: null,
    userId: null,
    isLoading: true,
  });

  useEffect(() => {
    loadToken().then((saved) => {
      if (saved) {
        setAuthState({ token: saved.token, userId: saved.userId, isLoading: false });
      } else {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    });
  }, []);

  const setAuth = useCallback(async (token: string, userId: string) => {
    await saveToken(token, userId);
    setAuthState({ token, userId, isLoading: false });
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setAuthState({ token: null, userId: null, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ auth, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
