import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@auth/AuthContext';
import type { ModuleBuilderRequest, ModuleBuilderSummary, ModuleSchemaResponse } from '@app/types';
import CreateModuleForm from './moduleBuilder/CreateModuleForm';
import AddColumnModal from './moduleBuilder/AddColumnModal';
import ModulesToolbar from './moduleBuilder/ModulesToolbar';
import ModulesTable from './moduleBuilder/ModulesTable';
import DeleteModuleModal from './moduleBuilder/DeleteModuleModal';
import {
  fetchModuleSummaries, fetchModuleFullSpec, fetchModuleSchema, deleteModule,
  installModuleZip as installModuleZipRequest, uploadModuleUiPage as uploadModuleUiPageRequest,
  uploadModuleUiBuild as uploadModuleUiBuildRequest, rescanModules as rescanModulesRequest,
} from './services/moduleBuilderService';

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

  const fetchModules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchModuleSummaries(headers);
      if (data) setModules(data);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void fetchModules(); }, [fetchModules]);

  const installModuleZip = async (file: File) => {
    setInstalling(true);
    setInstallMessage(null);
    try {
      const body = await installModuleZipRequest(file, headers);
      setInstallMessage({ type: 'success', text: `Module '${body.id ?? ''}' installé avec succès.` });
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
      const res = await rescanModulesRequest(headers);
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
      await uploadModuleUiPageRequest(moduleId, file, headers);
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
      await uploadModuleUiBuildRequest(moduleId, file, headers);
      setInstallMessage({ type: 'success', text: `Build UI de '${moduleId}' installé (mode standalone).` });
      void fetchModules();
    } catch (err) {
      setInstallMessage({ type: 'error', text: err instanceof Error ? err.message : "Échec de l'envoi du build" });
    } finally {
      setBusyId(null);
      if (buildFileInputRef.current) buildFileInputRef.current.value = '';
    }
  };

  const openAddColumn = async (mod: ModuleBuilderSummary) => {
    setBusyId(mod.id);
    try {
      const schema = await fetchModuleSchema(mod.id, headers);
      if (schema) setSchemaFor(schema);
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = async (mod: ModuleBuilderSummary) => {
    setEditLoadingId(mod.id);
    try {
      const spec = await fetchModuleFullSpec(mod.id, headers);
      if (spec) setEditSpec(spec);
    } finally {
      setEditLoadingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);
    try {
      await deleteModule(pendingDelete.id, dropData, headers);
      setPendingDelete(null);
      setDropData(false);
      void fetchModules();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto space-y-6 pr-1">
      <ModulesToolbar
        loading={loading}
        scanning={scanning}
        installing={installing}
        fileInputRef={fileInputRef}
        uiFileInputRef={uiFileInputRef}
        buildFileInputRef={buildFileInputRef}
        uiUploadTarget={uiUploadTarget}
        buildUploadTarget={buildUploadTarget}
        onRefresh={fetchModules}
        onRescan={rescanModules}
        onInstallFile={file => void installModuleZip(file)}
        onUiFile={(moduleId, file) => void uploadUiPage(moduleId, file)}
        onBuildFile={(moduleId, file) => void uploadUiBuild(moduleId, file)}
        onCreate={() => setShowCreate(true)}
      />

      {installMessage && (
        <div className={`alert ${installMessage.type === 'success' ? 'alert-success' : 'alert-error'} text-sm py-2`}>
          <span>{installMessage.text}</span>
        </div>
      )}

      <ModulesTable
        modules={modules}
        busyId={busyId}
        editLoadingId={editLoadingId}
        uiFileInputRef={uiFileInputRef}
        buildFileInputRef={buildFileInputRef}
        uiUploadTarget={uiUploadTarget}
        buildUploadTarget={buildUploadTarget}
        onEdit={openEdit}
        onAddColumn={openAddColumn}
        onDeleteRequest={setPendingDelete}
      />

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
        <DeleteModuleModal
          pendingDelete={pendingDelete}
          dropData={dropData}
          busy={busyId === pendingDelete.id}
          onChangeDropData={setDropData}
          onCancel={() => { setPendingDelete(null); setDropData(false); }}
          onConfirm={() => void confirmDelete()}
        />
      )}
    </div>
  );
}
