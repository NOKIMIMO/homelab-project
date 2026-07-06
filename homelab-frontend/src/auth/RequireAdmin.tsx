import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@auth/AuthContext';

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  const location = useLocation();

  if (!isAdmin) {
    return <Navigate to="/403" replace state={{ from: location }} />;
  }

  return children;
}
