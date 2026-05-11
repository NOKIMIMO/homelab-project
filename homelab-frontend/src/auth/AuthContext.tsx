import { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface AuthContextValue {
  token: string | null;
  userName: string | null;
  isAuthenticated: boolean;
  login: (token: string, userName?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = 'homelab_token';
const USER_KEY = 'homelab_user_name';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY));
  const [userName, setUserName] = useState<string | null>(() => sessionStorage.getItem(USER_KEY));

  const login = useCallback((newToken: string, name?: string) => {
    sessionStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);

    if (name) {
      sessionStorage.setItem(USER_KEY, name);
      setUserName(name);
    } else {
      sessionStorage.removeItem(USER_KEY);
      setUserName(null);
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    setToken(null);
    setUserName(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      userName,
      isAuthenticated: Boolean(token),
      login,
      logout
    }),
    [token, userName, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
