import { useEffect, useState } from 'react';
import { Plus, X, Save } from 'lucide-react';
import { useAuth } from '@auth/AuthContext';
import { getApiUrl } from '@lib/api';
import type {
  DependencySpec,
  Module,
  ModuleBuilderRequest,
  ModuleParamSpec,
} from '@app/types';
import { emptyDependency, emptyParam, emptyTable, stampPreviousNames } from './formDefaults';
import { useTableSpecs } from './useTableSpecs';
import { buildModuleBuilderRequest } from './buildModuleBuilderRequest';
import {
  fetchExistingModules, fetchAvailableActionTypes,
  createModule, updateModule, uploadModuleIcon,
} from '../services/moduleBuilderService';
import { fetchModuleSettings, updateModuleSettings } from '../services/moduleSettingsService';
import IconUploader from './IconUploader';
import DependencyPicker from './DependencyPicker';
import AccessToggles from './AccessToggles';
import ModuleParamsEditor from './ModuleParamsEditor';
import TableBlock from './TableBlock';

interface Props {
  onClose: () => void;
  onCreated: () => void;
  initialSpec?: ModuleBuilderRequest;
}

export default function CreateModuleForm({ onClose, onCreated, initialSpec }: Props) {
  const isEditing = initialSpec !== undefined;
  const { token } = useAuth();
  const [id, setId] = useState(initialSpec?.id ?? '');
  const [name, setName] = useState(initialSpec?.name ?? '');
  const [description, setDescription] = useState(initialSpec?.description ?? '');
  const tableSpecs = useTableSpecs(initialSpec ? stampPreviousNames(initialSpec.tables) : [emptyTable()]);
  const { tables } = tableSpecs;
  const [params, setParams] = useState<ModuleParamSpec[]>(initialSpec?.params ?? []);
  const [dependencies, setDependencies] = useState<DependencySpec[]>(initialSpec?.dependencies ?? []);
  // Never edited from this form -- only the dedicated UI-page/UI-build upload buttons in
  // ModuleBuilderTab set these; carried through unchanged so a regular save doesn't clobber them.
  const icon = initialSpec?.icon ?? null;
  const uiMode = initialSpec?.uiMode ?? 'JSON';
  const uiCustomized = initialSpec?.uiCustomized ?? false;
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [writeAdminOnly, setWriteAdminOnly] = useState(false);
  const [deleteAdminOnly, setDeleteAdminOnly] = useState(false);
  const [existingModules, setExistingModules] = useState<Module[]>([]);
  const [availableActionTypes, setAvailableActionTypes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const headers: HeadersInit = token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
  const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    void (async () => {
      const [modulesRes, actionsRes] = await Promise.all([
        fetchExistingModules(authHeaders),
        fetchAvailableActionTypes(authHeaders),
      ]);
      if (modulesRes) setExistingModules(modulesRes);
      if (actionsRes) setAvailableActionTypes(actionsRes);
    })();
  }, [token]);

  useEffect(() => {
    if (!isEditing || !initialSpec) return;
    void (async () => {
      const all = await fetchModuleSettings(authHeaders);
      const mine = all?.[initialSpec.id];
      if (mine) {
        setWriteAdminOnly(mine.writeAdminOnly);
        setDeleteAdminOnly(mine.deleteAdminOnly);
      }
    })();
  }, [isEditing, initialSpec, token]);

  const otherModules = existingModules.filter(m => m.id !== id.trim());

  const updateDependency = (idx: number, patch: Partial<DependencySpec>) =>
    setDependencies(prev => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  const addDependency = () => setDependencies(prev => [...prev, emptyDependency(otherModules[0]?.id ?? '')]);
  const removeDependency = (idx: number) => setDependencies(prev => prev.filter((_, i) => i !== idx));

  const updateParam = (idx: number, patch: Partial<ModuleParamSpec>) =>
    setParams(prev => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  const addParam = () => setParams(prev => [...prev, emptyParam()]);
  const removeParam = (idx: number) => setParams(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const body = buildModuleBuilderRequest({ id, name, description, tables, params, dependencies, icon, uiMode, uiCustomized });
      const moduleId = id.trim();
      const res = isEditing
        ? await updateModule(moduleId, body, headers)
        : await createModule(body, headers);

      if (!res.ok) {
        const errBody = await res.json().catch(() => null) as { error?: string } | null;
        setError(errBody?.error ?? `Échec de ${isEditing ? "la modification" : "la création"} (${res.status})`);
        return;
      }

      if (iconFile) {
        const iconRes = await uploadModuleIcon(moduleId, iconFile, authHeaders);
        if (!iconRes.ok) {
          const errBody = await iconRes.json().catch(() => null) as { error?: string } | null;
          setError(errBody?.error ?? "Module enregistré, mais l'envoi de l'icône a échoué");
          return;
        }
      }

      const settingsRes = await updateModuleSettings(moduleId, { writeAdminOnly, deleteAdminOnly }, headers);
      if (!settingsRes.ok) {
        setError("Module enregistré, mais l'enregistrement des accès a échoué");
        return;
      }

      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-base-300 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between px-6 py-4 border-b border-base-content/10">
          <h2 className="text-lg font-black">{isEditing ? `Modifier ${initialSpec.name}` : 'Créer un module'}</h2>
          <button className="btn btn-ghost btn-sm btn-square" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Identifiant</label>
              <input
                className="input input-bordered input-sm w-full font-mono disabled:opacity-60"
                placeholder="mon_module"
                value={id}
                disabled={isEditing}
                onChange={e => setId(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Nom</label>
              <input
                className="input input-bordered input-sm w-full"
                placeholder="Mon Module"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-sm font-semibold">Description</label>
              <input
                className="input input-bordered input-sm w-full"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>

          <IconUploader
            existingIconUrl={isEditing && initialSpec ? getApiUrl(`/api/modules/${initialSpec.id}/UI/icon`) : null}
            onFileSelected={setIconFile}
          />

          <DependencyPicker
            dependencies={dependencies}
            otherModules={otherModules}
            onUpdate={updateDependency}
            onAdd={addDependency}
            onRemove={removeDependency}
          />

          <AccessToggles
            writeAdminOnly={writeAdminOnly}
            deleteAdminOnly={deleteAdminOnly}
            onChangeWriteAdminOnly={setWriteAdminOnly}
            onChangeDeleteAdminOnly={setDeleteAdminOnly}
          />

          <ModuleParamsEditor
            params={params}
            onUpdate={updateParam}
            onAdd={addParam}
            onRemove={removeParam}
          />

          {isEditing && (
            <p className="text-[11px] opacity-50">
              Renommer une table/colonne est appliqué en place. Retyper une colonne tente une conversion des données existantes (peut échouer si incompatible). Supprimer une table ou une colonne existante n'est pas supporté ici.
            </p>
          )}

          {isEditing && uiCustomized && (
            <p className="text-[11px] text-info">
              Ce module a une page UI personnalisée (fichier ou build envoyé manuellement) : elle ne sera pas régénérée par cet enregistrement.
            </p>
          )}

          <div className="space-y-4">
            {tables.map((table, tIdx) => (
              <TableBlock
                key={tIdx}
                table={table}
                tIdx={tIdx}
                otherTableNames={tableSpecs.otherTableNames(tIdx)}
                canRemove={tables.length > 1}
                availableActionTypes={availableActionTypes}
                ops={tableSpecs}
              />
            ))}
          </div>

          <button className="btn btn-sm btn-outline gap-1" onClick={tableSpecs.addTable}>
            <Plus size={14} /> Ajouter une table
          </button>

          {error && <p className="text-sm text-error">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-base-content/10">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Annuler</button>
          <button
            className="btn btn-sm btn-primary gap-2 min-w-28"
            onClick={handleSubmit}
            disabled={submitting || !id.trim() || !name.trim() || tables.some(t => !t.name.trim())}
          >
            {submitting ? <span className="loading loading-spinner loading-xs" /> : <Save size={14} />}
            {isEditing ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  );
}
