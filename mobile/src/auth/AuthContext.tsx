import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { clearToken, loadToken, saveToken } from './tokenStorage';

export interface UserProfile {
  displayName: string | null;
  email: string | null;
  oauthProvider: string | null;
  createdAt: string; // ISO string
}

interface AuthState {
  token: string | null;
  userId: string | null;
  profile: UserProfile | null;
  isLoading: boolean;
}

interface AuthContextValue {
  auth: AuthState;
  setAuth: (
    token: string,
    userId: string,
    profile: UserProfile,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  auth: { token: null, userId: null, profile: null, isLoading: true },
  setAuth: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuthState] = useState<AuthState>({
    token: null,
    userId: null,
    profile: null,
    isLoading: true,
  });

  useEffect(() => {
    loadToken().then((saved) => {
      if (saved) {
        setAuthState({
          token: saved.token,
          userId: saved.userId,
          profile: saved.profile,
          isLoading: false,
        });
      } else {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    });
  }, []);

  const setAuth = useCallback(
    async (token: string, userId: string, profile: UserProfile) => {
      await saveToken(token, userId, profile);
      setAuthState({ token, userId, profile, isLoading: false });
    },
    [],
  );

  const logout = useCallback(async () => {
    await clearToken();
    setAuthState({
      token: null,
      userId: null,
      profile: null,
      isLoading: false,
    });
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
