import { useCallback, useEffect, useRef, useState } from 'react';
import { Columns3, FileJson, PackageOpen, Pencil, Plus, RefreshCw, RotateCw, Trash2, Upload } from 'lucide-react';
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
  const [installing, setInstalling] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [installMessage, setInstallMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uiFileInputRef = useRef<HTMLInputElement>(null);
  const buildFileInputRef = useRef<HTMLInputElement>(null);
  const uiUploadTarget = useRef<string | null>(null);
  const buildUploadTarget = useRef<string | null>(null);

  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  const installModuleZip = async (file: File) => {
    setInstalling(true);
    setInstallMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(getApiUrl('/api/modules/install'), {
        method: 'POST',
        headers,
        body: formData,
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error ?? body?.message ?? "Échec de l'installation du module");
      }
      setInstallMessage({ type: 'success', text: `Module '${body?.id ?? ''}' installé avec succès.` });
      void fetchModules();
    } catch (err) {
      setInstallMessage({ type: 'error', text: err instanceof Error ? err.message : "Échec de l'installation du module" });
    } finally {
      setInstalling(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const rescanModules = async () => {
    setScanning(true);
    setInstallMessage(null);
    try {
      const res = await fetch(getApiUrl('/api/modules/scan'), { method: 'POST', headers });
      if (!res.ok) throw new Error('Échec du rescan des modules');
      setInstallMessage({ type: 'success', text: 'Modules rechargés depuis le disque.' });
      void fetchModules();
    } catch (err) {
      setInstallMessage({ type: 'error', text: err instanceof Error ? err.message : 'Échec du rescan des modules' });
    } finally {
      setScanning(false);
    }
  };

  const uploadUiPage = async (moduleId: string, file: File) => {
    setBusyId(moduleId);
    setInstallMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(getApiUrl(`/api/admin/module-builder/${moduleId}/ui-page`), {
        method: 'POST',
        headers,
        body: formData,
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error ?? "Échec de l'envoi de la page UI");
      }
      setInstallMessage({ type: 'success', text: `Page UI de '${moduleId}' mise à jour.` });
      void fetchModules();
    } catch (err) {
      setInstallMessage({ type: 'error', text: err instanceof Error ? err.message : "Échec de l'envoi de la page UI" });
    } finally {
      setBusyId(null);
      if (uiFileInputRef.current) uiFileInputRef.current.value = '';
    }
  };

  const uploadUiBuild = async (moduleId: string, file: File) => {
    setBusyId(moduleId);
    setInstallMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(getApiUrl(`/api/admin/module-builder/${moduleId}/ui-build`), {
        method: 'POST',
        headers,
        body: formData,
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error ?? "Échec de l'envoi du build");
      }
      setInstallMessage({ type: 'success', text: `Build UI de '${moduleId}' installé (mode standalone).` });
      void fetchModules();
    } catch (err) {
      setInstallMessage({ type: 'error', text: err instanceof Error ? err.message : "Échec de l'envoi du build" });
    } finally {
      setBusyId(null);
      if (buildFileInputRef.current) buildFileInputRef.current.value = '';
    }
  };

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
          <button
            className="btn btn-xs btn-outline gap-1"
            onClick={rescanModules}
            disabled={scanning}
            title="Recharger les modules depuis le disque (POST /api/modules/scan)"
          >
            <RotateCw size={12} className={scanning ? 'animate-spin' : ''} />
            Rescanner les modules
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) void installModuleZip(file);
            }}
          />
          <input
            ref={uiFileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file && uiUploadTarget.current) void uploadUiPage(uiUploadTarget.current, file);
            }}
          />
          <input
            ref={buildFileInputRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file && buildUploadTarget.current) void uploadUiBuild(buildUploadTarget.current, file);
            }}
          />
          <button
            className="btn btn-sm btn-outline gap-2"
            disabled={installing}
            onClick={() => fileInputRef.current?.click()}
          >
            {installing
              ? <span className="loading loading-spinner loading-xs" />
              : <Upload size={14} />}
            Installer un module (.zip)
          </button>
          <button className="btn btn-sm btn-primary gap-2" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> Créer un module
          </button>
        </div>
      </div>

      {installMessage && (
        <div className={`alert ${installMessage.type === 'success' ? 'alert-success' : 'alert-error'} text-sm py-2`}>
          <span>{installMessage.text}</span>
        </div>
      )}

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
                          className="btn btn-xs btn-outline gap-1"
                          disabled={busyId === mod.id}
                          title="Remplacer la page UI par un fichier JSON"
                          onClick={() => { uiUploadTarget.current = mod.id; uiFileInputRef.current?.click(); }}
                        >
                          <FileJson size={12} /> UI
                        </button>
                        <button
                          className="btn btn-xs btn-outline gap-1"
                          disabled={busyId === mod.id}
                          title="Installer un build complet (.zip) -- passe le module en mode standalone"
                          onClick={() => { buildUploadTarget.current = mod.id; buildFileInputRef.current?.click(); }}
                        >
                          <PackageOpen size={12} /> Build
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
