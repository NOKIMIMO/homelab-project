import { useState, useEffect, useCallback } from 'react';
import { Check, X, Trash2, RefreshCw, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '@auth/AuthContext';
import { getApiUrl } from '@lib/api';
import RecoveryCodeReveal from '@ui/RecoveryCodeReveal';

interface User {
  id: number;
  email: string;
  name: string | null;
  isAdmin: boolean;
  createdAt: string;
  publicKey: string | null;
  permissions: string[];
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

interface PasswordResetRequest {
  id: number;
  email: string;
  status: string;
  createdAt: string;
  processedAt: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  PENDING:  'badge-warning',
  APPROVED: 'badge-success',
  REJECTED: 'badge-error',
};

export default function AccessTab() {
  const { token, userName } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<SignupRequest[]>([]);
  const [passwordResetRequests, setPasswordResetRequests] = useState<PasswordResetRequest[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [draftPermissions, setDraftPermissions] = useState<Set<string>>(new Set());
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);

  const headers: HeadersInit = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, requestsRes, permissionsRes, resetRequestsRes] = await Promise.all([
        fetch(getApiUrl('/api/admin/users'), { headers }),
        fetch(getApiUrl('/api/admin/signup-requests'), { headers }),
        fetch(getApiUrl('/api/admin/permissions'), { headers }),
        fetch(getApiUrl('/api/admin/password-reset-requests'), { headers }),
      ]);
      if (usersRes.ok) setUsers(await usersRes.json() as User[]);
      if (requestsRes.ok) setRequests(await requestsRes.json() as SignupRequest[]);
      if (permissionsRes.ok) setAvailablePermissions(await permissionsRes.json() as Record<string, string[]>);
      if (resetRequestsRes.ok) setPasswordResetRequests(await resetRequestsRes.json() as PasswordResetRequest[]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const deleteUser = async (id: number, email: string) => {
    if (email === userName) {
      alert("Vous ne pouvez pas supprimer votre propre compte.");
      return;
    }

    setActionId(id);
    try {
      await fetch(getApiUrl(`/api/admin/users/${id}`), { method: 'DELETE', headers });
      setUsers(prev => prev.filter(u => u.id !== id));
    } finally {
      setActionId(null);
    }
  };

  const switchAdminStatus = async (id: number, isAdmin: boolean, email: string) => {
    if (email === userName) {
      alert("Vous ne pouvez pas modifier votre propre statut d'administrateur.");
      return;
    }

    setActionId(id);
    try {
      await fetch(getApiUrl(`/api/admin/users/${id}/admin/${!isAdmin}`), {
        method: 'PUT',
        headers,
        body: JSON.stringify({ isAdmin: !isAdmin }),
      });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isAdmin: !isAdmin } : u));
    } finally {
      setActionId(null);
    }
  };

  const openPermissions = (u: User) => {
    setEditingUser(u);
    setDraftPermissions(new Set(u.permissions));
  };

  const togglePermission = (permission: string) => {
    setDraftPermissions(prev => {
      const next = new Set(prev);
      if (next.has(permission)) next.delete(permission);
      else next.add(permission);
      return next;
    });
  };

  const savePermissions = async () => {
    if (!editingUser) return;
    setSavingPermissions(true);
    try {
      const permissions = Array.from(draftPermissions);
      await fetch(getApiUrl(`/api/admin/users/${editingUser.id}/permissions`), {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(permissions),
      });
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, permissions } : u));
      setEditingUser(null);
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleRequest = async (id: number, action: 'approve' | 'reject') => {
    setActionId(id);
    try {
      await fetch(getApiUrl(`/api/admin/signup-requests/${id}/${action}`), {
        method: 'PUT',
        headers,
      });
      void fetchData();
    } finally {
      setActionId(null);
    }
  };

  const approvePasswordReset = async (id: number) => {
    setActionId(id);
    try {
      const res = await fetch(getApiUrl(`/api/admin/password-reset-requests/${id}/approve`), {
        method: 'PUT',
        headers,
      });
      const data = await res.json() as { success: boolean; temporaryPassword?: string; message?: string };
      if (data.success && data.temporaryPassword) {
        setRevealedPassword(data.temporaryPassword);
      } else if (data.message) {
        alert(data.message);
      }
      void fetchData();
    } finally {
      setActionId(null);
    }
  };

  const rejectPasswordReset = async (id: number) => {
    setActionId(id);
    try {
      await fetch(getApiUrl(`/api/admin/password-reset-requests/${id}/reject`), {
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
  const pendingPasswordResets = passwordResetRequests.filter(r => r.status === 'PENDING');
  const processedPasswordResets = passwordResetRequests.filter(r => r.status !== 'PENDING');

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
                <th>Admin</th>
                <th>Permissions</th>
                <th>Créé le</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-base-content/40 italic py-8">
                    Aucun utilisateur
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover">
                    <td className="text-xs opacity-40 tabular-nums">{u.id} {u.email  === userName ? " (vous)" : ""}</td>
                    <td>{u.name ?? <span className="opacity-30 italic">---</span>}</td>
                    <td className="font-mono text-xs">{u.email}</td>
                    <td>
                      <input
                        type="checkbox"
                        className={`toggle toggle-sm toggle-success ${
                          actionId === u.id ? "opacity-50" : ""
                        }
                        ${u.email === userName ? "cursor-not-allowed  disabled" : ""}`}
                        checked={u.isAdmin}
                        disabled={actionId === u.id && u.email !== userName}
                        onChange={() => switchAdminStatus(u.id, u.isAdmin, u.email)}
                      />
                    </td>
                    <td>
                      {u.isAdmin ? (
                        <span className="text-xs opacity-40 italic">admin (tout accès)</span>
                      ) : (
                        <button className="btn btn-xs btn-outline gap-1" onClick={() => openPermissions(u)}>
                          <ShieldCheck size={12} />
                          {u.permissions.length > 0 ? `${u.permissions.length} accordée(s)` : 'Gérer'}
                        </button>
                      )}
                    </td>
                    <td className="text-xs opacity-60">
                      {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td>
                      <button
                        className={`btn btn-xs btn-error btn-ghost
                          ${u.email === userName ? "cursor-not-allowed opacity-50 disabled" : ""}
                        `}
                        disabled={actionId === u.id && u.email !== userName}
                        onClick={() => deleteUser(u.id, u.email)}
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
                        : '---'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Demandes de reset de mot de passe ── */}
      <section>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <KeyRound size={18} className="opacity-70" />
          Demandes de reset de mot de passe
          {pendingPasswordResets.length > 0 && (
            <span className="badge badge-warning badge-sm">{pendingPasswordResets.length}</span>
          )}
        </h2>

        {pendingPasswordResets.length === 0 ? (
          <div className="alert bg-base-300 text-sm">
            <Check size={16} className="text-success" />
            <span>Aucune demande de reset en attente.</span>
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {pendingPasswordResets.map(r => (
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
                    onClick={() => approvePasswordReset(r.id)}
                  >
                    {actionId === r.id
                      ? <span className="loading loading-spinner loading-xs" />
                      : <Check size={14} />}
                    Approuver
                  </button>
                  <button
                    className="btn btn-sm btn-error btn-outline gap-1"
                    disabled={actionId === r.id}
                    onClick={() => rejectPasswordReset(r.id)}
                  >
                    <X size={14} /> Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {processedPasswordResets.length > 0 && (
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
                {processedPasswordResets.map(r => (
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

      {/* ── Révélation du mot de passe temporaire ── */}
      {revealedPassword && (
        <RecoveryCodeReveal
          code={revealedPassword}
          onClose={() => setRevealedPassword(null)}
          label="Mot de passe temporaire"
          description="Communiquez ce mot de passe temporaire à l'utilisateur par un canal sûr. Il n'est valable qu'une seule connexion : il devra en définir un nouveau juste après."
          confirmLabel="J'ai transmis ce mot de passe"
        />
      )}

      {/* ── Modal permissions ── */}
      {editingUser && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-1">Permissions de {editingUser.name ?? editingUser.email}</h3>
            <p className="text-xs opacity-60 mb-4">
              Seules les permissions déclarées par un module sont applicables ; un module qui n'en déclare aucune reste accessible à tous.
            </p>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.entries(availablePermissions).filter(([, perms]) => perms.length > 0).length === 0 ? (
                <p className="text-sm opacity-40 italic">Aucun module ne déclare de permission pour l'instant.</p>
              ) : (
                Object.entries(availablePermissions)
                  .filter(([, perms]) => perms.length > 0)
                  .map(([moduleId, perms]) => (
                    <div key={moduleId}>
                      <p className="text-xs font-semibold uppercase tracking-wide opacity-60 mb-1">{moduleId}</p>
                      <div className="flex flex-wrap gap-2">
                        {perms.map(p => (
                          <label key={p} className="label cursor-pointer gap-2 bg-base-300 rounded-lg px-3 py-1">
                            <input
                              type="checkbox"
                              className="checkbox checkbox-xs"
                              checked={draftPermissions.has(p)}
                              onChange={() => togglePermission(p)}
                            />
                            <span className="font-mono text-xs">{p}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </div>
            <div className="modal-action">
              <button className="btn btn-sm btn-ghost" onClick={() => setEditingUser(null)} disabled={savingPermissions}>
                Annuler
              </button>
              <button className="btn btn-sm btn-primary" onClick={savePermissions} disabled={savingPermissions}>
                {savingPermissions ? <span className="loading loading-spinner loading-xs" /> : 'Enregistrer'}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => !savingPermissions && setEditingUser(null)} />
        </div>
      )}
    </div>
  );
}
