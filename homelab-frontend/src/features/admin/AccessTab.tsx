import { useState, useEffect, useCallback } from 'react';
import { Check, X, Trash2, RefreshCw, Key } from 'lucide-react';
import { useAuth } from '@auth/AuthContext';
import { getApiUrl } from '@lib/api';

interface User {
  id: number;
  email: string;
  name: string | null;
  createdAt: string;
  publicKey: string | null;
}

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

export default function AccessTab() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<SignupRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);

  const headers: HeadersInit = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, requestsRes] = await Promise.all([
        fetch(getApiUrl('/api/auth/users'), { headers }),
        fetch(getApiUrl('/api/auth/signup-requests'), { headers }),
      ]);
      if (usersRes.ok) setUsers(await usersRes.json() as User[]);
      if (requestsRes.ok) setRequests(await requestsRes.json() as SignupRequest[]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const deleteUser = async (id: number) => {
    setActionId(id);
    try {
      await fetch(getApiUrl(`/api/auth/users/${id}`), { method: 'DELETE', headers });
      setUsers(prev => prev.filter(u => u.id !== id));
    } finally {
      setActionId(null);
    }
  };

  const handleRequest = async (id: number, action: 'approve' | 'reject') => {
    setActionId(id);
    try {
      await fetch(getApiUrl(`/api/auth/signup-requests/${id}/${action}`), {
        method: 'PUT',
        headers,
      });
      void fetchData();
    } finally {
      setActionId(null);
    }
  };

  const pending = requests.filter(r => r.status === 'PENDING');
  const processed = requests.filter(r => r.status !== 'PENDING');

  return (
    <div className="h-full overflow-y-auto space-y-8 pr-1">

      {/* ── Utilisateurs ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Utilisateurs</h2>
          <button className="btn btn-xs btn-outline gap-1" onClick={fetchData} disabled={loading}>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-base-content/10">
          <table className="table table-sm w-full">
            <thead>
              <tr className="bg-base-300 text-xs uppercase tracking-wide">
                <th>ID</th>
                <th>Nom</th>
                <th>Email</th>
                <th>Créé le</th>
                <th>Clé pub.</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-base-content/40 italic py-8">
                    Aucun utilisateur
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover">
                    <td className="text-xs opacity-40 tabular-nums">{u.id}</td>
                    <td>{u.name ?? <span className="opacity-30 italic">—</span>}</td>
                    <td className="font-mono text-xs">{u.email}</td>
                    <td className="text-xs opacity-60">
                      {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td>
                      {u.publicKey ? (
                        <span className="badge badge-xs badge-success gap-1">
                          <Key size={8} /> Oui
                        </span>
                      ) : (
                        <span className="badge badge-xs badge-ghost">Non</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-xs btn-error btn-ghost"
                        disabled={actionId === u.id}
                        onClick={() => deleteUser(u.id)}
                      >
                        {actionId === u.id
                          ? <span className="loading loading-spinner loading-xs" />
                          : <Trash2 size={12} />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

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
                {r.publicKey && (
                  <span className="badge badge-xs badge-info gap-1 shrink-0">
                    <Key size={8} /> Clé publique
                  </span>
                )}
                <div className="flex gap-2 shrink-0">
                  <button
                    className="btn btn-sm btn-success gap-1"
                    disabled={actionId === r.id}
                    onClick={() => handleRequest(r.id!, 'approve')}
                  >
                    {actionId === r.id
                      ? <span className="loading loading-spinner loading-xs" />
                      : <Check size={14} />}
                    Approuver
                  </button>
                  <button
                    className="btn btn-sm btn-error btn-outline gap-1"
                    disabled={actionId === r.id}
                    onClick={() => handleRequest(r.id!, 'reject')}
                  >
                    <X size={14} /> Rejeter
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
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
