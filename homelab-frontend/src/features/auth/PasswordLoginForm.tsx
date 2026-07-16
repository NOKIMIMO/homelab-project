import { useState } from 'react';
import { Key, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { loginWithPassword, registerUser } from './authHooks';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

interface PasswordLoginFormProps {
  onLoginSuccess: (token: string, keyName: string, mustResetPassword?: boolean) => void;
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
      setError("Invalid email");
      return;
    }

    if (!passwordValid) {
      setError("Password too weak");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await registerUser(email, password);

      if (result.success) {
        setSuccess(
          result.message ||
            "Registration successful. Your account will need to be validated by an administrator."
        );
        return;
      }
      setError(result.message || "Registration failed");
    } catch (err) {
      console.error(err);
      setError('Technical error while signing in with email.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailValid) {
      setError("Invalid email");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await loginWithPassword(email, password);

      if (result.success && result.token) {
        onLoginSuccess(result.token, result.keyName || email, result.mustResetPassword);
        return;
      }

      setError(result.message || "Authentication failed");
    } catch (err) {
      console.error(err);
      setError('Technical error while signing in with email.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setError(null);
    setSuccess(null);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setError(null);
    setSuccess(null);
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

      {success && (
        <div className="alert alert-success mb-2 border border-success/20 shadow-sm">
          <CheckCircle2 size={18} />
          <span className="text-xs font-bold">{success}</span>
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
              setSuccess(null);
            }}
          >
            Sign In
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
              setSuccess(null);
            }}
          >
            Sign Up
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
            placeholder="you@example.com"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            required
          />
        </div>

        <div className="form-control w-full gap-1">
          <label className="label pb-1">
            <span className="label-text font-bold">Password</span>
          </label>
          <input
            type="password"
            className={`input input-bordered h-12 w-full rounded-xl bg-base-200 focus:input-primary ${
              passwordFlow === 'signup' && password && !passwordValid
                ? 'input-error'
                : ''
            }`}
            placeholder="Your password"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            required
          />
          {passwordFlow === 'signup' && (
            <div className="text-xs opacity-70 space-y-1 mt-2">
              <p className="font-semibold">Your password must contain:</p>

              <ul className="list-disc ml-4 space-y-1">
                <li className={password.length >= 8 ? 'text-success' : ''}>
                  At least 8 characters
                </li>
                <li className={/[A-Z]/.test(password) ? 'text-success' : ''}>
                  An uppercase letter
                </li>
                <li className={/[a-z]/.test(password) ? 'text-success' : ''}>
                  A lowercase letter
                </li>
                <li className={/\d/.test(password) ? 'text-success' : ''}>
                  A digit
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
          ? "Sign Up Request"
          : 'Sign In to Homelab'}
      </button>
    </form>
  );
}
