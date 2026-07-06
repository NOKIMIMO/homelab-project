import { useState } from 'react';
import { Key, Loader2, AlertCircle } from 'lucide-react';
import { loginWithPassword, registerUser } from './authHooks';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

interface PasswordLoginFormProps {
  onLoginSuccess: (token: string, keyName: string) => void;
}

export default function PasswordLoginForm({ onLoginSuccess }: PasswordLoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordFlow, setPasswordFlow] = useState<'login' | 'signup'>('login');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emailValid = emailRegex.test(email);
  const passwordValid =
    passwordFlow === 'login' ? true : passwordRegex.test(password);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailValid) {
      setError("Email invalide");
      return;
    }

    if (!passwordValid) {
      setError("Mot de passe trop faible");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await registerUser(email, password);

      if (result.success && result.token) {
        setSuccess("Inscription réussie. L'administrateur vous contactera pour valider votre compte.");
        return;
      }
      setError(result.message || "Echec de l'enregistrement");
    } catch (err) {
      console.error(err);
      setError('Erreur technique lors de la connexion par email.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailValid) {
      setError("Email invalide");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await loginWithPassword(email, password);

      if (result.success && result.token) {
        onLoginSuccess(result.token, result.keyName || email);
        return;
      }

      setError(result.message || "Echec de l'authentification");
    } catch (err) {
      console.error(err);
      setError('Erreur technique lors de la connexion par email.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setError(null);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setError(null);
  };

  return (
    <form
      onSubmit={passwordFlow === 'signup' ? handleRegister : handlePasswordLogin}
      className="space-y-6"
    >
      {error && (
        <div className="alert alert-error mb-2 border border-error/20 shadow-sm">
          <AlertCircle size={18} />
          <span className="text-xs font-bold">{error}</span>
        </div>
      )}

      <div className="rounded-2xl border border-base-content/10 bg-base-200/70 p-2">
        <div className="grid grid-cols-2 gap-2">
        <button
            type="button"
            className={`btn btn-sm ${
              passwordFlow === 'login'
                ? 'btn-primary shadow-lg shadow-primary/20'
                : 'btn-ghost'
            }`}
            onClick={() => {
              setPasswordFlow('login');
              setError(null);
            }}
          >
            Connexion
          </button>

          <button
            type="button"
            className={`btn btn-sm ${
              passwordFlow === 'signup'
                ? 'btn-primary shadow-lg shadow-primary/20'
                : 'btn-ghost'
            }`}
            onClick={() => {
              setPasswordFlow('signup');
              setError(null);
            }}
          >
            Inscription
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="form-control w-full gap-1">
          <label className="label pb-1">
            <span className="label-text font-bold">Email</span>
          </label>
          <input
            type="email"
            className={`input input-bordered h-12 w-full rounded-xl bg-base-200 focus:input-primary ${
              email && !emailValid ? 'input-error' : ''
            }`}
            placeholder="vous@exemple.com"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            required
          />
        </div>

        <div className="form-control w-full gap-1">
          <label className="label pb-1">
            <span className="label-text font-bold">Mot de passe</span>
          </label>
          <input
            type="password"
            className={`input input-bordered h-12 w-full rounded-xl bg-base-200 focus:input-primary ${
              passwordFlow === 'signup' && password && !passwordValid
                ? 'input-error'
                : ''
            }`}
            placeholder="Votre mot de passe"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            required
          />
          {passwordFlow === 'signup' && (
            <div className="text-xs opacity-70 space-y-1 mt-2">
              <p className="font-semibold">Le mot de passe doit contenir :</p>

              <ul className="list-disc ml-4 space-y-1">
                <li className={password.length >= 8 ? 'text-success' : ''}>
                  Minimum 8 caractères
                </li>
                <li className={/[A-Z]/.test(password) ? 'text-success' : ''}>
                  Une majuscule
                </li>
                <li className={/[a-z]/.test(password) ? 'text-success' : ''}>
                  Une minuscule
                </li>
                <li className={/\d/.test(password) ? 'text-success' : ''}>
                  Un chiffre
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <button
        className="btn btn-primary w-full gap-2 shadow-lg shadow-primary/20 h-14 rounded-2xl text-base"
        disabled={loading || !emailValid || (passwordFlow === 'signup' && !passwordValid)}
      >
        {loading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <Key size={20} />
        )}

        {passwordFlow === 'signup'
          ? "Demande d'inscription"
          : 'Connexion au Homelab'}
      </button>
    </form>
  );
}
