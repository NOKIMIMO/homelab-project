import { useState, useEffect, useCallback } from 'react';
import { ShieldPlus, Plus, Trash2, RefreshCw, Pencil, X, Clock, Shield } from 'lucide-react';
import type { Role, RoleRequest, Module, DayOfWeek, AdminPermission } from '@app/types';
import { useAuth } from '@auth/AuthContext';
import { getApiUrl } from '@lib/api';

const EMPTY_FORM: RoleRequest = { name: '', moduleIds: [], blockedWindows: [], adminPermissions: [] };

const ADMIN_PERMISSIONS: { key: AdminPermission; label: string; description: string }[] = [
  {
    key: 'ADMIN_ACCESS',
    label: 'Administrator access',
    description: "Full administrator rights (also required to sign in on mobile), except ejecting the administrator or changing the administrator's account",
  },
];

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'MONDAY',    label: 'Monday' },
  { key: 'TUESDAY',   label: 'Tuesday' },
  { key: 'WEDNESDAY', label: 'Wednesday' },
  { key: 'THURSDAY',  label: 'Thursday' },
  { key: 'FRIDAY',    label: 'Friday' },
  { key: 'SATURDAY',  label: 'Saturday' },
  { key: 'SUNDAY',    label: 'Sunday' },
];

// Quarter-hour slots for the pickers below.
const TIMES = Array.from({ length: 96 }, (_, i) => {
  const h = String(Math.floor(i / 4)).padStart(2, '0');
  const m = String((i % 4) * 15).padStart(2, '0');
  return `${h}:${m}`;
});

// Zero-dependency 24h time picker: a DaisyUI dropdown listing quarter-hour slots, so the format
// never depends on the browser locale (no AM/PM). Value stays "HH:mm". `openUp` flips the menu
// upward for the lower rows so it isn't clipped by the scrolling card.
function TimeSelect({ value, onChange, openUp }: {
  value: string;
  onChange: (v: string) => void;
  openUp?: boolean;
}) {
  return (
    <div className={`dropdown ${openUp ? 'dropdown-top' : ''}`}>
      <div tabIndex={0} role="button" className="btn btn-xs btn-outline font-mono font-normal w-16">
        {value}
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu menu-xs flex-nowrap bg-base-100 border border-base-300 rounded-box shadow-lg z-10 w-20 max-h-48 overflow-y-auto p-1"
      >
        {TIMES.map(t => (
          <li key={t}>
            <a
              className={`font-mono ${t === value ? 'active' : ''}`}
              onClick={() => { onChange(t); (document.activeElement as HTMLElement | null)?.blur(); }}
            >
              {t}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RolesTab() {
  const { token } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [form, setForm] = useState<RoleRequest>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const headers: HeadersInit = token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };

  const fetchRoles = useCallback(async () => {
    const res = await fetch(getApiUrl('/api/admin/roles'), { headers });
    if (res.ok) setRoles(await res.json() as Role[]);
  }, [token]);

  const fetchModules = useCallback(async () => {
    const res = await fetch(getApiUrl('/api/modules'), { headers });
    if (res.ok) setModules(await res.json() as Module[]);
  }, [token]);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchRoles(), fetchModules()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchRoles, fetchModules]);

  useEffect(() => { void refreshAll(); }, [refreshAll]);

  const toggleModule = (moduleId: string) => {
    setForm(prev => ({
      ...prev,
      moduleIds: prev.moduleIds.includes(moduleId)
        ? prev.moduleIds.filter(m => m !== moduleId)
        : [...prev.moduleIds, moduleId],
    }));
  };

  const toggleAdminPermission = (permission: AdminPermission) => {
    setForm(prev => ({
      ...prev,
      adminPermissions: prev.adminPermissions.includes(permission)
        ? prev.adminPermissions.filter(p => p !== permission)
        : [...prev.adminPermissions, permission],
    }));
  };

  const windowFor = (day: DayOfWeek) => form.blockedWindows.find(w => w.dayOfWeek === day);

  const setDayBlocked = (day: DayOfWeek, on: boolean) => {
    setForm(prev => ({
      ...prev,
      blockedWindows: on
        ? [...prev.blockedWindows.filter(w => w.dayOfWeek !== day), { dayOfWeek: day, start: '20:00', end: '07:00' }]
        : prev.blockedWindows.filter(w => w.dayOfWeek !== day),
    }));
  };

  const setDayTime = (day: DayOfWeek, field: 'start' | 'end', value: string) => {
    setForm(prev => ({
      ...prev,
      blockedWindows: prev.blockedWindows.map(w => w.dayOfWeek === day ? { ...w, [field]: value } : w),
    }));
  };

  const startEdit = (role: Role) => {
    setEditingId(role.id);
    setForm({
      name: role.name,
      moduleIds: [...role.moduleIds],
      blockedWindows: role.blockedWindows.map(w => ({
        dayOfWeek: w.dayOfWeek,
        start: w.start.slice(0, 5),
        end: w.end.slice(0, 5),
      })),
      adminPermissions: [...role.adminPermissions],
    });
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  };

  const saveRole = async () => {
    setSaving(true);
    setError(null);
    try {
      const url = editingId != null ? `/api/admin/roles/${editingId}` : '/api/admin/roles';
      const res = await fetch(getApiUrl(url), {
        method: editingId != null ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(form),
      });
      if (res.ok) {
        cancelEdit();
        void fetchRoles();
      } else {
        const body = await res.json().catch(() => null) as { error?: string } | null;
        setError(body?.error ?? 'Unable to save');
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteRole = async (id: number) => {
    const res = await fetch(getApiUrl(`/api/admin/roles/${id}`), { method: 'DELETE', headers });
    if (res.ok) {
      if (editingId === id) cancelEdit();
      void fetchRoles();
    }
  };

  const moduleName = (id: string) => modules.find(m => m.id === id)?.name ?? id;

  return (
    <div className="h-full overflow-y-auto space-y-6 max-w-3xl pr-1">

      {/* ── Create / edit role ── */}
      <div className="card bg-base-300">
        <div className="card-body gap-4">
          <h2 className="card-title text-base flex items-center gap-2">
            <ShieldPlus size={16} className="opacity-60" />
            {editingId != null ? 'Edit role' : 'New role'}
          </h2>
          <p className="text-xs text-base-content/50 -mt-2">
            A user with this role can use all checked modules (all their actions),
            except during blocked time slots.
          </p>

          <label className="form-control">
            <span className="label-text text-xs mb-1">Role name</span>
            <input
              className="input input-bordered input-sm"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="E.g. Adult, Guest, Moderator…"
            />
          </label>

          <div>
            <span className="label-text text-xs">Allowed modules</span>
            {modules.length === 0 ? (
              <p className="text-sm text-base-content/50 italic mt-1">No modules found.</p>
            ) : (
              <div className="flex flex-col gap-2 mt-2">
                {modules.map(m => (
                  <label key={m.id} className="flex items-center gap-3 bg-base-200 rounded-lg px-3 py-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="toggle toggle-sm toggle-primary"
                      checked={form.moduleIds.includes(m.id)}
                      onChange={() => toggleModule(m.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm truncate block">{m.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <span className="label-text text-xs flex items-center gap-1.5">
              <Clock size={13} className="opacity-60" /> Time restrictions
              <span className="opacity-50">(access blocked during these slots)</span>
            </span>
            <div className="flex flex-col gap-1.5 mt-2">
              {DAYS.map((d, i) => {
                const w = windowFor(d.key);
                return (
                  <div key={d.key} className="flex items-center gap-3 bg-base-200 rounded-lg px-3 py-1.5">
                    <label className="flex items-center gap-2 cursor-pointer w-28 shrink-0">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-xs"
                        checked={!!w}
                        onChange={e => setDayBlocked(d.key, e.target.checked)}
                      />
                      <span className="text-sm">{d.label}</span>
                    </label>
                    {w ? (
                      <div className="flex items-center gap-2">
                        <span className="opacity-50 text-xs">from</span>
                        <TimeSelect value={w.start} onChange={v => setDayTime(d.key, 'start', v)} openUp={i >= 4} />
                        <span className="opacity-50 text-xs">to</span>
                        <TimeSelect value={w.end} onChange={v => setDayTime(d.key, 'end', v)} openUp={i >= 4} />
                      </div>
                    ) : (
                      <span className="text-xs opacity-40 italic">access allowed all day</span>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-base-content/40 mt-2">
              If the end time precedes the start time, the slot crosses midnight (e.g. 20:00 to 07:00).
              Times follow the server's time zone.
            </p>
          </div>

          <div>
            <span className="label-text text-xs flex items-center gap-1.5">
              <Shield size={13} className="opacity-60" /> Administration
              <span className="opacity-50">(global capabilities, independent of modules)</span>
            </span>
            <div className="flex flex-col gap-2 mt-2">
              {ADMIN_PERMISSIONS.map(p => (
                <label key={p.key} className="flex items-center gap-3 bg-base-200 rounded-lg px-3 py-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="toggle toggle-sm toggle-primary"
                    checked={form.adminPermissions.includes(p.key)}
                    onChange={() => toggleAdminPermission(p.key)}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm truncate block">{p.label}</span>
                    <span className="text-xs text-base-content/40">{p.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-error">{error}</p>}

          <div className="flex justify-end gap-2">
            {editingId != null && (
              <button className="btn btn-sm btn-ghost gap-1" onClick={cancelEdit} disabled={saving}>
                <X size={14} /> Cancel
              </button>
            )}
            <button
              className="btn btn-sm btn-primary gap-2"
              onClick={() => void saveRole()}
              disabled={saving || form.name.trim() === ''}
            >
              {saving ? <span className="loading loading-spinner loading-xs" /> : <Plus size={14} />}
              {editingId != null ? 'Update' : 'Create role'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Existing roles ── */}
      <div className="card bg-base-300">
        <div className="card-body gap-3">
          <div className="flex items-center justify-between">
            <h2 className="card-title text-base">Existing roles</h2>
            <button className="btn btn-xs btn-ghost gap-1" onClick={() => void refreshAll()} disabled={refreshing}>
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>

          {roles.length === 0 ? (
            <p className="text-sm text-base-content/50 italic">No roles configured.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {roles.map(role => (
                <div key={role.id} className="flex items-center gap-3 bg-base-200 rounded-lg px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm truncate block">{role.name}</span>
                    <span className="text-xs text-base-content/50">
                      {role.moduleIds.length === 0
                        ? 'no modules'
                        : role.moduleIds.map(moduleName).join(', ')}
                    </span>
                    {role.blockedWindows.length > 0 && (
                      <span className="text-xs text-warning flex items-center gap-1 mt-0.5">
                        <Clock size={11} /> restricted hours ({role.blockedWindows.length} d)
                      </span>
                    )}
                    {role.adminPermissions.length > 0 && (
                      <span className="text-xs text-primary flex items-center gap-1 mt-0.5">
                        <Shield size={11} />
                        {role.adminPermissions.map(p => ADMIN_PERMISSIONS.find(a => a.key === p)?.label ?? p).join(', ')}
                      </span>
                    )}
                  </div>
                  <button className="btn btn-xs btn-ghost" onClick={() => startEdit(role)} aria-label="Edit">
                    <Pencil size={14} />
                  </button>
                  <button className="btn btn-xs btn-ghost text-error" onClick={() => void deleteRole(role.id)} aria-label="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
