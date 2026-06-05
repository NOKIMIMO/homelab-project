import { useEffect, useState } from 'react';
import BootstrapPanel from './BootstrapPanel';
import { fetchKeys } from './authHooks';
import PasswordLoginForm from './PasswordLoginForm';

interface LoginProps {
  onLoginSuccess: (token: string, keyName: string) => void;
  onShowBootstrap: () => void;
}

export default function LoginForm({ onLoginSuccess, onShowBootstrap }: LoginProps) {
  const [noKeys, setNoKeys] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchKeys()
      .then((keys) => {
        if (mounted) setNoKeys(keys.length === 0);
      })
      .catch((err) => console.error(err));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-base-300 p-4 md:p-8">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-linear-to-br from-primary/15 via-base-200 to-base-300 p-8 md:p-10">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-secondary/20 blur-2xl" />
          <div className="relative">
            {/* <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles size={14} /> Acces securise
            </div> */}
            
            <h1 className="text-3xl font-black leading-tight md:text-4xl">Bienvenue sur votre Homelab</h1>
            <p className="mt-3 max-w-md text-sm text-base-content/70">
               Informations diverses du owner (TODO:)
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-base-content/10 bg-base-100 p-6 shadow-2xl md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold">Connexion</h2>
            <p className="mt-1 text-sm text-base-content/60">Saisissez vos identifiants pour continuer</p>
          </div>

          <PasswordLoginForm onLoginSuccess={onLoginSuccess} />

          {noKeys && <BootstrapPanel onShowBootstrap={onShowBootstrap} />}
        </div>
      </div>

    </div>
  );
}
