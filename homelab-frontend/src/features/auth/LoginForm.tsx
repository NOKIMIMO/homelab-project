import { useEffect, useState } from 'react';
// import BootstrapPanel from './BootstrapPanel';
// import { fetchKeys } from './authHooks';
import PasswordLoginForm from './PasswordLoginForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import RecoveryResetForm from './RecoveryResetForm';
import HardResetInfo from './HardResetInfo';
import { getApiUrl } from '@lib/api';

interface LoginProps {
  onLoginSuccess: (token: string, keyName: string, mustResetPassword?: boolean) => void;
  onShowBootstrap: () => void;
}

type View = 'login' | 'forgotPassword' | 'recovery' | 'hardReset';

const DEFAULT_DESCRIPTION = "Votre espace personnel, hébergé chez vous.";

export default function LoginForm({ onLoginSuccess }: LoginProps) {
  const [view, setView] = useState<View>('login');
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  // const [noKeys, setNoKeys] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch(getApiUrl('/api/auth/login-settings'))
      .then(res => (res.ok ? res.json() as Promise<{ description?: string | null }> : null))
      .then(data => {
        if (mounted && data?.description) setDescription(data.description);
      })
      .catch(() => { /* keep default description */ });
    return () => { mounted = false; };
  }, []);

  // useEffect(() => {
  //   let mounted = true;
  //   fetchKeys()
  //     .then((keys) => {
  //       if (mounted) setNoKeys(keys.length === 0);
  //     })
  //     .catch((err) => console.error(err));
  //   return () => {
  //     mounted = false;
  //   };
  // }, []);

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
            <p className="mt-3 max-w-md text-sm text-base-content/70 whitespace-pre-line">
              {description}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-base-content/10 bg-base-100 p-6 shadow-2xl md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold">Connexion</h2>
            <p className="mt-1 text-sm text-base-content/60">Saisissez vos identifiants pour continuer</p>
          </div>

          {view === 'login' && (
            <>
              <PasswordLoginForm onLoginSuccess={onLoginSuccess} />
              <button
                type="button"
                className="btn btn-ghost btn-xs w-full mt-4 opacity-60"
                onClick={() => setView('forgotPassword')}
              >
                Mot de passe oublié ?
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-xs w-full opacity-60"
                onClick={() => setView('recovery')}
              >
                Code de reset perdu ?
              </button>
            </>
          )}

          {view === 'forgotPassword' && (
            <ForgotPasswordForm onBack={() => setView('login')} />
          )}

          {view === 'recovery' && (
            <RecoveryResetForm
              onResetSuccess={onLoginSuccess}
              onShowHardReset={() => setView('hardReset')}
            />
          )}

          {view === 'hardReset' && (
            <HardResetInfo onBack={() => setView('recovery')} />
          )}

          {view === 'recovery' && (
            <button
              type="button"
              className="btn btn-ghost btn-xs w-full mt-2 opacity-60"
              onClick={() => setView('login')}
            >
              Retour à la connexion
            </button>
          )}

          {/* {noKeys && <BootstrapPanel onShowBootstrap={onShowBootstrap} />} */}
        </div>
      </div>

    </div>
  );
}
