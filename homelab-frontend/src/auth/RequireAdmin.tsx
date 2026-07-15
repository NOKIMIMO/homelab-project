import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@auth/AuthContext';

// Guards the /admin route. Full admins always pass; a plain user holding at least one
// administration permission (e.g. MANAGE_ROLES) also gets in - AdminPanel itself only shows the
// tabs that permission actually covers.
export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin, adminPermissions } = useAuth();
  const location = useLocation();

  if (!isAdmin && adminPermissions.length === 0) {
    return <Navigate to="/403" replace state={{ from: location }} />;
  }

  return children;
}
