import { Check, X, KeyRound } from 'lucide-react';
import type { PasswordResetRequest } from '../services/accessService';
import { STATUS_BADGE } from './statusBadge';

interface Props {
  pending: PasswordResetRequest[];
  processed: PasswordResetRequest[];
  actionId: number | null;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

export default function PasswordResetSection({ pending, processed, actionId, onApprove, onReject }: Props) {
  return (
    <section>
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
        <KeyRound size={18} className="opacity-70" />
        Demandes de reset de mot de passe
        {pending.length > 0 && (
          <span className="badge badge-warning badge-sm">{pending.length}</span>
        )}
      </h2>

      {pending.length === 0 ? (
        <div className="alert bg-base-300 text-sm">
          <Check size={16} className="text-success" />
          <span>Aucune demande de reset en attente.</span>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {pending.map(r => (
            <div
              key={r.id}
              className="flex items-center gap-4 p-4 bg-base-300 rounded-xl border border-warning/20"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold font-mono truncate">{r.email}</p>
                <p className="text-xs opacity-40 mt-1">
                  Demandé le {new Date(r.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  className="btn btn-sm btn-success gap-1"
                  disabled={actionId === r.id}
                  onClick={() => onApprove(r.id)}
                >
                  {actionId === r.id
                    ? <span className="loading loading-spinner loading-xs" />
                    : <Check size={14} />}
                  Approuver
                </button>
                <button
                  className="btn btn-sm btn-error btn-outline gap-1"
                  disabled={actionId === r.id}
                  onClick={() => onReject(r.id)}
                >
                  <X size={14} /> Rejeter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {processed.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-base-content/10">
          <table className="table table-sm w-full">
            <thead>
              <tr className="bg-base-300 text-xs uppercase tracking-wide">
                <th>Email</th>
                <th>Statut</th>
                <th>Demandé le</th>
                <th>Traité le</th>
              </tr>
            </thead>
            <tbody>
              {processed.map(r => (
                <tr key={r.id} className="hover">
                  <td className="font-mono text-xs">{r.email}</td>
                  <td>
                    <span className={`badge badge-xs ${STATUS_BADGE[r.status] ?? 'badge-ghost'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="text-xs opacity-60">
                    {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="text-xs opacity-60">
                    {r.processedAt
                      ? new Date(r.processedAt).toLocaleDateString('fr-FR')
                      : '---'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
