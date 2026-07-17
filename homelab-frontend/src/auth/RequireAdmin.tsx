import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@auth/AuthContext';

// Guards the /admin route. Full admins always pass; so does any user holding the ADMIN_ACCESS
// administration permission, who then has the full panel (minus the actions reserved to the real
// administrator, which are enforced per-action).
export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin, adminPermissions } = useAuth();
  const location = useLocation();

  if (!isAdmin && !adminPermissions.includes('ADMIN_ACCESS')) {
    return <Navigate to="/403" replace state={{ from: location }} />;
  }

  return children;
}
