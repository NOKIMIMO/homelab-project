import { createContext, useContext } from 'react';

interface AuthContextValue {
  token: string | null;
  userName: string | null;
  isAdmin: boolean;
  // Effective AdminPermission.name() values granted via the user's roles (today only "ADMIN_ACCESS").
  // Empty for a plain user; a full admin implicitly holds everything but this array only reflects
  // role-granted permissions - always check isAdmin too, don't rely on this array alone.
  adminPermissions: string[];
  isAuthenticated: boolean;
  login: (token: string, userName?: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
