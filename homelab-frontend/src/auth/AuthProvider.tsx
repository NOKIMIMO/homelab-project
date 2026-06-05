import { useState, useCallback, useMemo, type ReactNode } from "react";
import { AuthContext } from '@auth/AuthContext';


const TOKEN_KEY = 'homelab_token';
const USER_KEY = 'homelab_user_name';

export function AuthProvider({ children }: { children: ReactNode }) {
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