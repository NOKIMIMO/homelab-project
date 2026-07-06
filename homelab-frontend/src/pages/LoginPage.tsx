import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '@auth/AuthContext';
import LoginForm from '@features/auth/LoginForm';

export default function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showBootstrap, setShowBootstrap] = useState(false);

  const redirectPath = useMemo(() => {
    const state = location.state as { from?: { pathname?: string } } | null;
    return state?.from?.pathname || '/';
  }, [location.state]);

  const handleLoginSuccess = (token: string, keyName: string) => {
    auth.login(token, keyName);
    navigate(redirectPath, { replace: true });
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
