import type { RefObject } from 'react';
import { Plus, RefreshCw, RotateCw, Upload } from 'lucide-react';

interface Props {
  loading: boolean;
  scanning: boolean;
  installing: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  uiFileInputRef: RefObject<HTMLInputElement | null>;
  buildFileInputRef: RefObject<HTMLInputElement | null>;
  uiUploadTarget: RefObject<string | null>;
  buildUploadTarget: RefObject<string | null>;
  onRefresh: () => void;
  onRescan: () => void;
  onInstallFile: (file: File) => void;
  onUiFile: (moduleId: string, file: File) => void;
  onBuildFile: (moduleId: string, file: File) => void;
  onCreate: () => void;
}

export default function ModulesToolbar({
  loading, scanning, installing,
  fileInputRef, uiFileInputRef, buildFileInputRef, uiUploadTarget, buildUploadTarget,
  onRefresh, onRescan, onInstallFile, onUiFile, onBuildFile, onCreate,
}: Props) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button className="btn btn-xs btn-outline gap-1" onClick={onRefresh} disabled={loading}>
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
        <button
          className="btn btn-xs btn-outline gap-1"
          onClick={onRescan}
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
            if (file) onInstallFile(file);
          }}
        />
        <input
          ref={uiFileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file && uiUploadTarget.current) onUiFile(uiUploadTarget.current, file);
          }}
        />
        <input
          ref={buildFileInputRef}
          type="file"
          accept=".zip"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file && buildUploadTarget.current) onBuildFile(buildUploadTarget.current, file);
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
          Importer un module (.zip)
        </button>
        <button className="btn btn-sm btn-primary gap-2" onClick={onCreate}>
          <Plus size={14} /> Créer un module
        </button>
      </div>
    </div>
  );
}
