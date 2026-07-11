import { useState } from 'react';
import { AlertCircle, KeyRound, Loader2 } from 'lucide-react';
import { getApiUrl } from '@lib/api';
import RecoveryCodeReveal from '@ui/RecoveryCodeReveal';

interface RecoveryResetFormProps {
  onResetSuccess: (token: string, userEmail: string) => void;
  onShowHardReset: () => void;
}

interface ResetResult {
  success: boolean;
  token?: string;
  userEmail?: string;
  recoveryCode?: string;
  message?: string;
}

export default function RecoveryResetForm({ onResetSuccess, onShowHardReset }: RecoveryResetFormProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingSuccess, setPendingSuccess] = useState<{ token: string; userEmail: string } | null>(null);
  const [revealedCode, setRevealedCode] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(getApiUrl('/api/auth/reset'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name, email, password }),
      });
      const data = await res.json() as ResetResult;

      if (!res.ok || !data.success || !data.token || !data.userEmail) {
        setError(data.message || 'Code de récupération invalide');
        return;
      }

      setPendingSuccess({ token: data.token, userEmail: data.userEmail });
      if (data.recoveryCode) setRevealedCode(data.recoveryCode);
    } catch (err) {
      console.error(err);
      setError('Erreur technique lors de la réinitialisation.');
    } finally {
      setLoading(false);
    }
  };

  const closeRevealAndProceed = () => {
    setRevealedCode(null);
    if (pendingSuccess) onResetSuccess(pendingSuccess.token, pendingSuccess.userEmail);
  };

  return (
    <div className="space-y-6">
      <div className="badge badge-warning gap-2">Réinitialisation d'urgence</div>
      <p className="text-xs opacity-60">
        Présenter un code de récupération valide supprime tous les comptes existants et crée un
        nouveau compte administrateur avec les informations ci-dessous.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="alert alert-error border border-error/20 shadow-sm">
            <AlertCircle size={18} />
            <span className="text-xs font-bold">{error}</span>
          </div>
        )}

        <div className="form-control w-full gap-1">
          <label className="label pb-1"><span className="label-text font-bold">Code de récupération</span></label>
          <input
            type="text"
            className="input input-bordered h-12 w-full rounded-xl bg-base-200 font-mono focus:input-primary"
            placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
            value={code}
            onChange={e => setCode(e.target.value)}
            required
          />
        </div>

        <div className="form-control w-full gap-1">
          <label className="label pb-1"><span className="label-text font-bold">Nom</span></label>
          <input
            type="text"
            className="input input-bordered h-12 w-full rounded-xl bg-base-200 focus:input-primary"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="form-control w-full gap-1">
          <label className="label pb-1"><span className="label-text font-bold">Email</span></label>
          <input
            type="email"
            className="input input-bordered h-12 w-full rounded-xl bg-base-200 focus:input-primary"
            placeholder="vous@exemple.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-control w-full gap-1">
          <label className="label pb-1"><span className="label-text font-bold">Nouveau mot de passe</span></label>
          <input
            type="password"
            className="input input-bordered h-12 w-full rounded-xl bg-base-200 focus:input-primary"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          className="btn btn-warning w-full gap-2 h-14 rounded-2xl text-base"
          disabled={loading}
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <KeyRound size={20} />}
          Réinitialiser et créer le compte admin
        </button>
      </form>

      <button type="button" className="btn btn-ghost btn-sm w-full" onClick={onShowHardReset}>
        Code de recupération perdu ? 
        <br/>Informations sur la réinitialisation d'urgence
      </button>

      {revealedCode && (
        <RecoveryCodeReveal code={revealedCode} onClose={closeRevealAndProceed} />
      )}
    </div>
  );
}
