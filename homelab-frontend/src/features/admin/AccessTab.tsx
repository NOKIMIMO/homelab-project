import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Check, X, Trash2, RefreshCw, KeyRound, UsersRound, Repeat } from 'lucide-react';
import type { Role } from '@app/types';
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
  roleIds: number[];
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
  const { token, userName, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<SignupRequest[]>([]);
  const [passwordResetRequests, setPasswordResetRequests] = useState<PasswordResetRequest[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [editingRolesUser, setEditingRolesUser] = useState<User | null>(null);
  const [draftRoles, setDraftRoles] = useState<Set<number>>(new Set());
  const [savingRoles, setSavingRoles] = useState(false);
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);
  const [approvingRequest, setApprovingRequest] = useState<SignupRequest | null>(null);
  const [draftApproveRoles, setDraftApproveRoles] = useState<Set<number>>(new Set());
  const [approving, setApproving] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState<number | null>(null);
  const [transferring, setTransferring] = useState(false);

  const headers: HeadersInit = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, requestsRes, resetRequestsRes, rolesRes] = await Promise.all([
        fetch(getApiUrl('/api/admin/users'), { headers }),
        fetch(getApiUrl('/api/admin/signup-requests'), { headers }),
        fetch(getApiUrl('/api/admin/password-reset-requests'), { headers }),
        fetch(getApiUrl('/api/admin/roles'), { headers }),
      ]);
      if (usersRes.ok) setUsers(await usersRes.json() as User[]);
      if (requestsRes.ok) setRequests(await requestsRes.json() as SignupRequest[]);
      if (resetRequestsRes.ok) setPasswordResetRequests(await resetRequestsRes.json() as PasswordResetRequest[]);
      if (rolesRes.ok) setRoles(await rolesRes.json() as Role[]);
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

  const openTransfer = () => {
    setTransferTargetId(null);
    setTransferOpen(true);
  };

  const confirmTransfer = async () => {
    if (transferTargetId === null) return;
    setTransferring(true);
    try {
      const res = await fetch(getApiUrl(`/api/admin/users/${transferTargetId}/transfer-admin`), {
        method: 'POST',
        headers,
      });
      if (!res.ok) {
        let message = "Échec du transfert du rôle admin.";
        try {
          const data = await res.json() as { message?: string };
          message = data.message || message;
        } catch {
          // non-JSON error body
        }
        alert(message);
        return;
      }
      // The caller is no longer admin: their current token still carries the old claims, so
      // force a fresh login to pick up the demoted (moderator) role and permissions.
      setTransferOpen(false);
      logout();
      navigate('/login');
    } finally {
      setTransferring(false);
    }
  };

  const openRoles = (u: User) => {
    setEditingRolesUser(u);
    setDraftRoles(new Set(u.roleIds));
  };

  const toggleRole = (roleId: number) => {
    setDraftRoles(prev => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  };

  const saveRoles = async () => {
    if (!editingRolesUser) return;
    setSavingRoles(true);
    try {
      const roleIds = Array.from(draftRoles);
      const res = await fetch(getApiUrl(`/api/admin/users/${editingRolesUser.id}/roles`), {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(roleIds),
      });
      if (!res.ok) {
        alert("Échec de l'enregistrement des rôles.");
        return;
      }
      setUsers(prev => prev.map(u => u.id === editingRolesUser.id ? { ...u, roleIds } : u));
      setEditingRolesUser(null);
    } finally {
      setSavingRoles(false);
    }
  };

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

  const approvePasswordReset = async (id: number) => {
    setActionId(id);
    try {
      const res = await fetch(getApiUrl(`/api/admin/password-reset-requests/${id}/approve`), {
        method: 'PUT',
        headers,
      });
      if (!res.ok) {
        alert("Échec de l'approbation de la demande.");
        return;
      }
      let data: { success: boolean; temporaryPassword?: string; message?: string };
      try {
        data = await res.json() as { success: boolean; temporaryPassword?: string; message?: string };
      } catch {
        alert("Réponse invalide du serveur.");
        return;
      }
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
                <th>Rôles</th>
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
                      <div className="flex flex-col items-center gap-1">
                        {u.isAdmin ? (
                          <span className="badge badge-success badge-sm">Admin</span>
                        ) : (
                          <span className="text-xs opacity-30 italic">---</span>
                        )}
                        {u.email === userName && u.isAdmin && (
                          <button
                            className="btn btn-2xs btn-outline gap-1"
                            onClick={openTransfer}
                          >
                            <Repeat size={11} /> Transférer
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      {u.isAdmin ? (
                        <span className="text-xs opacity-40 italic">---</span>
                      ) : (
                        <button className="btn btn-xs btn-outline gap-1" onClick={() => openRoles(u)}>
                          <UsersRound size={12} />
                          {u.roleIds.length > 0 ? `${u.roleIds.length} rôle(s)` : 'Assigner'}
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
                    onClick={() => openApprove(r)}
                  >
                    <Check size={14} />
                    Approuver
                  </button>
                  <button
                    className="btn btn-sm btn-error btn-outline gap-1"
                    disabled={actionId === r.id}
                    onClick={() => rejectRequest(r.id!)}
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

      {/* ── Modal rôles ── */}
      {editingRolesUser && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-1">Rôles de {editingRolesUser.name ?? editingRolesUser.email}</h3>
            <p className="text-xs opacity-60 mb-4">
              Un rôle donne accès à tous les modules qu'il autorise. Les rôles s'ajoutent aux permissions accordées individuellement.
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {roles.length === 0 ? (
                <p className="text-sm opacity-40 italic">Aucun rôle n'a encore été créé (onglet Rôles).</p>
              ) : (
                roles.map(role => (
                  <label key={role.id} className="flex items-center gap-3 bg-base-300 rounded-lg px-3 py-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={draftRoles.has(role.id)}
                      onChange={() => toggleRole(role.id)}
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
              <button className="btn btn-sm btn-ghost" onClick={() => setEditingRolesUser(null)} disabled={savingRoles}>
                Annuler
              </button>
              <button className="btn btn-sm btn-primary" onClick={saveRoles} disabled={savingRoles}>
                {savingRoles ? <span className="loading loading-spinner loading-xs" /> : 'Enregistrer'}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => !savingRoles && setEditingRolesUser(null)} />
        </div>
      )}

      {/* ── Modal transfert du rôle admin ── */}
      {transferOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-1">Transférer le rôle administrateur</h3>
            <p className="text-xs opacity-60 mb-4">
              Vous cesserez d'être administrateur et deviendrez modérateur (rôle "Modérateur"
              conservant les permissions d'administration). Vous serez déconnecté pour recharger
              vos droits.
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {users.filter(u => u.email !== userName).length === 0 ? (
                <p className="text-sm opacity-40 italic">Aucun autre utilisateur disponible.</p>
              ) : (
                users.filter(u => u.email !== userName).map(u => (
                  <label key={u.id} className="flex items-center gap-3 bg-base-300 rounded-lg px-3 py-2 cursor-pointer">
                    <input
                      type="radio"
                      name="transfer-target"
                      className="radio radio-sm"
                      checked={transferTargetId === u.id}
                      onChange={() => setTransferTargetId(u.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm truncate block">{u.name ?? u.email}</span>
                      <span className="text-xs opacity-50 font-mono">{u.email}</span>
                    </div>
                  </label>
                ))
              )}
            </div>
            <div className="modal-action">
              <button className="btn btn-sm btn-ghost" onClick={() => setTransferOpen(false)} disabled={transferring}>
                Annuler
              </button>
              <button
                className="btn btn-sm btn-warning"
                onClick={() => void confirmTransfer()}
                disabled={transferring || transferTargetId === null}
              >
                {transferring ? <span className="loading loading-spinner loading-xs" /> : 'Transférer'}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => !transferring && setTransferOpen(false)} />
        </div>
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
                <p className="text-sm opacity-40 italic">Aucun rôle n'a encore été créé (onglet Rôles).</p>
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
    </div>
  );
}
