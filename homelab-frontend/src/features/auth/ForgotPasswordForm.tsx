import { useState } from 'react';
import { Loader2, AlertCircle, Mail, CheckCircle2 } from 'lucide-react';
import { requestPasswordReset } from './authHooks';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export default function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailValid = emailRegex.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid) {
      setError('Invalid email');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await requestPasswordReset(email);
      if (result.success) {
        setSuccess(true);
        return;
      }
      setError(result.message || 'Request failed');
    } catch (err) {
      console.error(err);
      setError('Technical error while submitting the request.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div className="alert alert-success border border-success/20 shadow-sm">
          <CheckCircle2 size={18} />
          <span className="text-xs font-bold">
            Request sent. An administrator must approve it before a temporary password becomes available.
          </span>
        </div>
        <button type="button" className="btn btn-ghost btn-sm w-full" onClick={onBack}>
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-base-content/60">
        Enter your email. An administrator will need to approve the request before you can sign back in with a temporary password.
      </p>

      {error && (
        <div className="alert alert-error mb-2 border border-error/20 shadow-sm">
          <AlertCircle size={18} />
          <span className="text-xs font-bold">{error}</span>
        </div>
      )}

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
          onChange={(e) => { setEmail(e.target.value); setError(null); }}
          required
        />
      </div>

      <button
        className="btn btn-primary w-full gap-2 shadow-lg shadow-primary/20 h-14 rounded-2xl text-base"
        disabled={loading || !emailValid}
      >
        {loading ? <Loader2 size={20} className="animate-spin" /> : <Mail size={20} />}
        Request a Reset
      </button>

      <button type="button" className="btn btn-ghost btn-xs w-full opacity-60" onClick={onBack}>
        Back to sign in
      </button>
    </form>
  );
}
