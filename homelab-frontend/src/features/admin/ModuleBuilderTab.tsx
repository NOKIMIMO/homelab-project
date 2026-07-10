import { useCallback, useEffect, useState } from 'react';
import { Columns3, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '@auth/AuthContext';
import { getApiUrl } from '@lib/api';
import type { ModuleBuilderRequest, ModuleBuilderSummary, ModuleSchemaResponse } from '@app/types';
import CreateModuleForm from './moduleBuilder/CreateModuleForm';
import AddColumnModal from './moduleBuilder/AddColumnModal';

export default function ModuleBuilderTab() {
  const { token } = useAuth();
  const [modules, setModules] = useState<ModuleBuilderSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editSpec, setEditSpec] = useState<ModuleBuilderRequest | null>(null);
  const [editLoadingId, setEditLoadingId] = useState<string | null>(null);
  const [schemaFor, setSchemaFor] = useState<ModuleSchemaResponse | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ModuleBuilderSummary | null>(null);
  const [dropData, setDropData] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchModules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/admin/module-builder'), { headers });
      if (res.ok) setModules(await res.json() as ModuleBuilderSummary[]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void fetchModules(); }, [fetchModules]);

  const openAddColumn = async (mod: ModuleBuilderSummary) => {
    setBusyId(mod.id);
    try {
      const res = await fetch(getApiUrl(`/api/admin/module-builder/${mod.id}/schema`), { headers });
      if (res.ok) setSchemaFor(await res.json() as ModuleSchemaResponse);
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = async (mod: ModuleBuilderSummary) => {
    setEditLoadingId(mod.id);
    try {
      const res = await fetch(getApiUrl(`/api/admin/module-builder/${mod.id}/full`), { headers });
      if (res.ok) setEditSpec(await res.json() as ModuleBuilderRequest);
    } finally {
      setEditLoadingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);
    try {
      await fetch(getApiUrl(`/api/admin/module-builder/${pendingDelete.id}?dropData=${dropData}`), {
        method: 'DELETE',
        headers,
      });
      setPendingDelete(null);
      setDropData(false);
      void fetchModules();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto space-y-6 pr-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="btn btn-xs btn-outline gap-1" onClick={fetchModules} disabled={loading}>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>
        <button className="btn btn-sm btn-primary gap-2" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Créer un module
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-base-content/10">
        <table className="table table-sm w-full">
          <thead>
            <tr className="bg-base-300 text-xs uppercase tracking-wide">
              <th>Identifiant</th>
              <th>Nom</th>
              <th>Description</th>
              <th>Type</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {modules.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-base-content/40 italic py-8">
                  Aucun module détecté.
                </td>
              </tr>
            ) : (
              modules.map(mod => (
                <tr key={mod.id} className="hover">
                  <td className="font-mono text-xs">{mod.id}</td>
                  <td>{mod.name}</td>
                  <td className="text-xs opacity-60">{mod.description ?? <span className="opacity-30 italic">---</span>}</td>
                  <td>
                    <span className={`badge badge-xs ${mod.custom ? 'badge-primary' : 'badge-ghost'}`}>
                      {mod.custom ? 'Personnalisé' : 'Système'}
                    </span>
                  </td>
                  <td className="flex items-center gap-2 justify-end">
                    {mod.custom ? (
                      <>
                        <button
                          className="btn btn-xs btn-outline gap-1"
                          disabled={editLoadingId === mod.id}
                          onClick={() => openEdit(mod)}
                        >
                          <Pencil size={12} /> Modifier
                        </button>
                        <button
                          className="btn btn-xs btn-outline gap-1"
                          disabled={busyId === mod.id}
                          onClick={() => openAddColumn(mod)}
                        >
                          <Columns3 size={12} /> Colonne
                        </button>
                        <button
                          className="btn btn-xs btn-error btn-ghost"
                          disabled={busyId === mod.id}
                          onClick={() => setPendingDelete(mod)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs opacity-30 italic">non modifiable ici</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateModuleForm
          onClose={() => setShowCreate(false)}
          onCreated={fetchModules}
        />
      )}

      {editSpec && (
        <CreateModuleForm
          key={editSpec.id}
          initialSpec={editSpec}
          onClose={() => setEditSpec(null)}
          onCreated={fetchModules}
        />
      )}

      {schemaFor && (
        <AddColumnModal
          moduleId={schemaFor.moduleId}
          schema={schemaFor}
          onClose={() => setSchemaFor(null)}
          onUpdated={fetchModules}
        />
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-base-300 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-black">Supprimer le module ?</h2>
            <p className="text-sm text-base-content/70">
              Le module <span className="font-mono">{pendingDelete.id}</span> sera retiré du disque et du tableau de bord.
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-error"
                checked={dropData}
                onChange={e => setDropData(e.target.checked)}
              />
              Supprimer aussi les données stockées (irréversible)
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button className="btn btn-ghost btn-sm" onClick={() => { setPendingDelete(null); setDropData(false); }}>
                Annuler
              </button>
              <button
                className="btn btn-sm btn-error gap-2"
                disabled={busyId === pendingDelete.id}
                onClick={confirmDelete}
              >
                {busyId === pendingDelete.id
                  ? <span className="loading loading-spinner loading-xs" />
                  : <Trash2 size={14} />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
