import { useQueryClient } from '@tanstack/react-query';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { queryKeys } from '@/lib/queryKeys';
import { clearToken, loadToken, saveToken } from './tokenStorage';

export interface UserProfile {
  displayName: string | null;
  email: string | null;
  oauthProvider: string | null;
  createdAt: string; // ISO string
  isPremium: boolean;
}

interface AuthState {
  token: string | null;
  userId: string | null;
  /** SecureStore 복원용 오프라인 스냅샷. 표시·isPremium은 useUserProfile 권장. */
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
  const queryClient = useQueryClient();
  const [auth, setAuthState] = useState<AuthState>({
    token: null,
    userId: null,
    profile: null,
    isLoading: true,
  });

  useEffect(() => {
    loadToken().then((saved) => {
      if (saved) {
        if (saved.profile) {
          queryClient.setQueryData(queryKeys.auth.me(), saved.profile);
        }
        void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
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
  }, [queryClient]);

  const setAuth = useCallback(
    async (token: string, userId: string, profile: UserProfile) => {
      await saveToken(token, userId, profile);
      queryClient.setQueryData(queryKeys.auth.me(), profile);
      setAuthState({ token, userId, profile, isLoading: false });
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    await clearToken();
    queryClient.removeQueries({ queryKey: queryKeys.auth.all });
    setAuthState({
      token: null,
      userId: null,
      profile: null,
      isLoading: false,
    });
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ auth, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
