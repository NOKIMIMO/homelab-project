import { useState, useEffect, useCallback } from 'react';
import { Check, X } from 'lucide-react';
import type { Role } from '@app/types';
import { useAuth } from '@auth/AuthContext';
import { getApiUrl } from '@lib/api';

interface SignupRequest {
  id: number;
  email: string;
  name: string | null;
  status: string;
  createdAt: string;
  processedAt: string | null;
  publicKey: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  PENDING:  'badge-warning',
  APPROVED: 'badge-success',
  REJECTED: 'badge-error',
};

// Reachable both by full admins (Accès tab) and by MANAGE_ROLES holders (Rôles tab) — the backend
// grants both the same access to the signup-requests endpoints (see AdminController.kt).
export default function SignupRequestsSection() {
  const { token } = useAuth();
  const [requests, setRequests] = useState<SignupRequest[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [actionId, setActionId] = useState<number | null>(null);
  const [approvingRequest, setApprovingRequest] = useState<SignupRequest | null>(null);
  const [draftApproveRoles, setDraftApproveRoles] = useState<Set<number>>(new Set());
  const [approving, setApproving] = useState(false);

  const headers: HeadersInit = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const fetchData = useCallback(async () => {
    const [requestsRes, rolesRes] = await Promise.all([
      fetch(getApiUrl('/api/admin/signup-requests'), { headers }),
      fetch(getApiUrl('/api/admin/roles'), { headers }),
    ]);
    if (requestsRes.ok) setRequests(await requestsRes.json() as SignupRequest[]);
    if (rolesRes.ok) setRoles(await rolesRes.json() as Role[]);
  }, [token]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const rejectRequest = async (id: number) => {
    setActionId(id);
    try {
      await fetch(getApiUrl(`/api/admin/signup-requests/${id}/reject`), {
        method: 'PUT',
        headers,
      });
      void fetchData();
    } finally {
      setActionId(null);
    }
  };

  const openApprove = (r: SignupRequest) => {
    setApprovingRequest(r);
    setDraftApproveRoles(new Set());
  };

  const toggleApproveRole = (roleId: number) => {
    setDraftApproveRoles(prev => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  };

  const confirmApprove = async () => {
    if (!approvingRequest || draftApproveRoles.size === 0) return;
    setApproving(true);
    try {
      const res = await fetch(getApiUrl(`/api/admin/signup-requests/${approvingRequest.id}/approve`), {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleIds: Array.from(draftApproveRoles) }),
      });
      if (!res.ok) {
        alert("Échec de l'approbation de la demande.");
        return;
      }
      setApprovingRequest(null);
      void fetchData();
    } finally {
      setApproving(false);
    }
  };

  const pending = requests.filter(r => r.status === 'PENDING');
  const processed = requests.filter(r => r.status !== 'PENDING');

  return (
    <>
      {/* ── Demandes en attente ── */}
      {pending.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            Demandes en attente
            <span className="badge badge-warning badge-sm">{pending.length}</span>
          </h2>
          <div className="space-y-2">
            {pending.map(r => (
              <div
                key={r.id}
                className="flex items-center gap-4 p-4 bg-base-300 rounded-xl border border-warning/20"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{r.name ?? r.email}</p>
                  <p className="text-xs opacity-60 font-mono truncate">{r.email}</p>
                  <p className="text-xs opacity-40 mt-1">
                    Demandé le {new Date(r.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    className="btn btn-sm btn-success gap-1"
                    disabled={actionId === r.id}
                    onClick={() => openApprove(r)}
                  >
                    <Check size={14} />
                    Approuver
                  </button>
                  <button
                    className="btn btn-sm btn-error btn-outline gap-1"
                    disabled={actionId === r.id}
                    onClick={() => rejectRequest(r.id)}
                  >
                    {actionId === r.id
                      ? <span className="loading loading-spinner loading-xs" />
                      : <X size={14} />}
                    Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {pending.length === 0 && (
        <div className="alert bg-base-300 text-sm">
          <Check size={16} className="text-success" />
          <span>Aucune demande d'accès en attente.</span>
        </div>
      )}

      {/* ── Historique ── */}
      {processed.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-3">Historique des demandes</h2>
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
        </section>
      )}

      {/* ── Modal approbation de demande ── */}
      {approvingRequest && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-1">
              Approuver {approvingRequest.name ?? approvingRequest.email}
            </h3>
            <p className="text-xs opacity-60 mb-4">
              Au moins un rôle doit être attribué pour créer le compte.
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {roles.length === 0 ? (
                <p className="text-sm opacity-40 italic">Aucun rôle n'a encore été créé.</p>
              ) : (
                roles.map(role => (
                  <label key={role.id} className="flex items-center gap-3 bg-base-300 rounded-lg px-3 py-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={draftApproveRoles.has(role.id)}
                      onChange={() => toggleApproveRole(role.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm truncate block">{role.name}</span>
                      <span className="text-xs opacity-50">
                        {role.moduleIds.length === 0 ? 'aucun module' : `${role.moduleIds.length} module(s)`}
                      </span>
                    </div>
                  </label>
                ))
              )}
            </div>
            <div className="modal-action">
              <button className="btn btn-sm btn-ghost" onClick={() => setApprovingRequest(null)} disabled={approving}>
                Annuler
              </button>
              <button
                className="btn btn-sm btn-success"
                onClick={() => void confirmApprove()}
                disabled={approving || draftApproveRoles.size === 0}
              >
                {approving ? <span className="loading loading-spinner loading-xs" /> : 'Approuver'}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => !approving && setApprovingRequest(null)} />
        </div>
      )}
    </>
  );
}
