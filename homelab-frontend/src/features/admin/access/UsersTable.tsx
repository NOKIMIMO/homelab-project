import { RefreshCw, Trash2 } from 'lucide-react';
import type { AdminUser } from '../services/accessService';

interface Props {
  users: AdminUser[];
  currentUserEmail: string | null;
  actionId: number | null;
  loading: boolean;
  onRefresh: () => void;
  onToggleAdmin: (id: number, isAdmin: boolean, email: string) => void;
  onDelete: (id: number, email: string) => void;
}

export default function UsersTable({ users, currentUserEmail, actionId, loading, onRefresh, onToggleAdmin, onDelete }: Props) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">Utilisateurs</h2>
        <button className="btn btn-xs btn-outline gap-1" onClick={onRefresh} disabled={loading}>
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
              <th>Créé le</th>
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
                  <td className="text-xs opacity-40 tabular-nums">{u.id} {u.email === currentUserEmail ? " (vous)" : ""}</td>
                  <td>{u.name ?? <span className="opacity-30 italic">---</span>}</td>
                  <td className="font-mono text-xs">{u.email}</td>
                  <td>
                    <input
                      type="checkbox"
                      className={`toggle toggle-sm toggle-success ${
                        actionId === u.id ? "opacity-50" : ""
                      }
                      ${u.email === currentUserEmail ? "cursor-not-allowed  disabled" : ""}`}
                      checked={u.isAdmin}
                      disabled={actionId === u.id && u.email !== currentUserEmail}
                      onChange={() => onToggleAdmin(u.id, u.isAdmin, u.email)}
                    />
                  </td>
                  <td className="text-xs opacity-60">
                    {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td>
                    <button
                      className={`btn btn-xs btn-error btn-ghost
                        ${u.email === currentUserEmail ? "cursor-not-allowed opacity-50 disabled" : ""}
                      `}
                      disabled={actionId === u.id && u.email !== currentUserEmail}
                      onClick={() => onDelete(u.id, u.email)}
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
  );
}
