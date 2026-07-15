import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '@auth/AuthContext';
import LoginForm from '@features/auth/LoginForm';

interface JwtPayload {
  isAdmin: boolean;
  adminPermissions?: string[];
}

export default function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showBootstrap, setShowBootstrap] = useState(false);

  const redirectPath = useMemo(() => {
    const state = location.state as { from?: { pathname?: string } } | null;
    return state?.from?.pathname || '/';
  }, [location.state]);

  // redirectPath was captured from whoever was on that page before (possibly a different
  // user who just logged out from a permission-gated page like /admin). It's only safe to
  // honor if the newly authenticated user actually has the rights that page requires -
  // otherwise send them to / instead of bouncing them through a 403.
  const handleLoginSuccess = (token: string, keyName: string, mustResetPassword?: boolean) => {
    auth.login(token, keyName);

    let target = mustResetPassword ? '/settings' : redirectPath;
    if (!mustResetPassword && target.startsWith('/admin')) {
      const claims = jwtDecode<JwtPayload>(token);
      const hasAdminAccess = claims.isAdmin || (claims.adminPermissions?.length ?? 0) > 0;
      if (!hasAdminAccess) target = '/';
    }

    navigate(target, { replace: true });
  };

  if (showBootstrap) {
    return (
      <div className="min-h-screen bg-base-300 flex flex-col pt-12">
        <div className="max-w-4xl mx-auto w-full px-4 text-center mb-6">
          <button className="btn btn-ghost btn-sm gap-2" onClick={() => setShowBootstrap(false)}>
            - Retour a la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <LoginForm
      onLoginSuccess={handleLoginSuccess}
      onShowBootstrap={() => setShowBootstrap(false)}
    />
  );
}
