import { KeyRound } from 'lucide-react';
import type { RecoveryCodeStatus } from '../services/appSettingsService';

interface Props {
  status: RecoveryCodeStatus | null;
  regenerating: boolean;
  onRegenerate: () => void;
}

export default function RecoveryCodeCard({ status, regenerating, onRegenerate }: Props) {
  return (
    <div className="card bg-base-300">
      <div className="card-body gap-4">
        <h2 className="card-title text-base flex items-center gap-2">
          <KeyRound size={16} className="opacity-60" /> Code de récupération
        </h2>
        <p className="text-xs text-base-content/50 -mt-2">
          Ce code d'urgence permet de réinitialiser tous les comptes et de recréer un compte admin
          en cas de perte d'accès. Régénérer ce code invalide immédiatement l'ancien.
        </p>

        {status && (
          <p className="text-sm">
            {status.exists
              ? <>Code configuré{status.createdAt && <> le <span className="font-mono">{new Date(status.createdAt).toLocaleString()}</span></>}.</>
              : 'Aucun code configuré.'}
          </p>
        )}

        <div>
          <button
            className="btn btn-sm btn-warning gap-2 w-fit"
            onClick={onRegenerate}
            disabled={regenerating}
          >
            {regenerating
              ? <span className="loading loading-spinner loading-xs" />
              : <KeyRound size={14} />}
            Régénérer le code
          </button>
        </div>
      </div>
    </div>
  );
}
