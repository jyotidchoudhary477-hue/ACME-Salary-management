import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, type AuthUser } from '../api/client';

const TOKEN_KEY = 'acme_auth_token';
const USER_KEY = 'acme_auth_user';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const persist = useCallback((nextToken: string, nextUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then((res) => {
        setUser(res.user);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      })
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [token, logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      login: async (email, password) => {
        const res = await api.login(email, password);
        persist(res.token, res.user);
      },
      signup: async (fullName, email, password) => {
        const res = await api.signup(fullName, email, password);
        persist(res.token, res.user);
      },
      logout,
    }),
    [user, token, loading, persist, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
