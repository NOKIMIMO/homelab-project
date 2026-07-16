import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, CheckCircle2, KeyRound, Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@auth/AuthContext';
import { authFetch } from '@auth/f_authFetch';

interface CurrentUser {
  email: string;
  mustResetPassword: boolean;
}

export default function ChangePasswordForm() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await authFetch('/api/auth/me', {}, () => {
        logout();
        navigate('/login');
      });
      if (res?.ok) {
        setCurrentUser(await res.json() as CurrentUser);
      }
    })();
  }, [logout, navigate]);

  const mustReset = currentUser?.mustResetPassword ?? false;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const newPasswordValid = newPassword.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPasswordValid) {
      setError('The new password must be at least 8 characters long');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: mustReset ? undefined : currentPassword,
          newPassword,
        }),
      }, () => {
        logout();
        navigate('/login');
      });

      const data = await res?.json() as { success: boolean; message?: string } | undefined;
      if (data?.success) {
        setSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setCurrentUser(prev => prev ? { ...prev, mustResetPassword: false } : prev);
        return;
      }
      setError(data?.message || 'Failed to update password');
    } catch (err) {
      console.error(err);
      setError('A technical error occurred while updating.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <KeyRound size={20} className="opacity-70" /> Change my password
        </h2>
        {currentUser && (
          <p className="mt-1 text-sm text-base-content/60 font-mono">{currentUser.email}</p>
        )}
      </div>

      {mustReset && (
        <div className="alert alert-warning border border-warning/20 shadow-sm">
          <ShieldAlert size={18} />
          <span className="text-xs font-bold">
            You are logged in with a temporary, single-use password. Set a new password to keep using your account.
          </span>
        </div>
      )}

      {error && (
        <div className="alert alert-error border border-error/20 shadow-sm">
          <AlertCircle size={18} />
          <span className="text-xs font-bold">{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success border border-success/20 shadow-sm">
          <CheckCircle2 size={18} />
          <span className="text-xs font-bold">Password updated.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!mustReset && (
          <div className="form-control w-full gap-1">
            <label className="label pb-1">
              <span className="label-text font-bold">Current password</span>
            </label>
            <input
              type="password"
              className="input input-bordered h-12 w-full rounded-xl bg-base-200 focus:input-primary"
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); setError(null); }}
              required
            />
          </div>
        )}

        <div className="form-control w-full gap-1">
          <label className="label pb-1">
            <span className="label-text font-bold">New password</span>
          </label>
          <input
            type="password"
            className={`input input-bordered h-12 w-full rounded-xl bg-base-200 focus:input-primary ${
              newPassword && !newPasswordValid ? 'input-error' : ''
            }`}
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
            required
          />
          <span className="text-xs opacity-60 mt-1">Minimum 8 characters</span>
        </div>

        <div className="form-control w-full gap-1">
          <label className="label pb-1">
            <span className="label-text font-bold">Confirm new password</span>
          </label>
          <input
            type="password"
            className={`input input-bordered h-12 w-full rounded-xl bg-base-200 focus:input-primary ${
              confirmPassword && !passwordsMatch ? 'input-error' : ''
            }`}
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
            required
          />
        </div>

        <button
          className="btn btn-primary w-full gap-2 shadow-lg shadow-primary/20 h-12 rounded-xl"
          disabled={loading || !newPasswordValid || !passwordsMatch || (!mustReset && !currentPassword)}
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
          Update
        </button>
      </form>
    </div>
  );
}
