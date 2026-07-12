import type { RefObject } from 'react';
import { Columns3, Download, FileJson, PackageOpen, Pencil, Trash2 } from 'lucide-react';
import type { ModuleBuilderSummary } from '@app/types';

interface Props {
  modules: ModuleBuilderSummary[];
  busyId: string | null;
  editLoadingId: string | null;
  uiFileInputRef: RefObject<HTMLInputElement | null>;
  buildFileInputRef: RefObject<HTMLInputElement | null>;
  uiUploadTarget: RefObject<string | null>;
  buildUploadTarget: RefObject<string | null>;
  onEdit: (mod: ModuleBuilderSummary) => void;
  onAddColumn: (mod: ModuleBuilderSummary) => void;
  onDeleteRequest: (mod: ModuleBuilderSummary) => void;
  onExport: (mod: ModuleBuilderSummary) => void;
}

export default function ModulesTable({
  modules, busyId, editLoadingId,
  uiFileInputRef, buildFileInputRef, uiUploadTarget, buildUploadTarget,
  onEdit, onAddColumn, onDeleteRequest, onExport,
}: Props) {
  return (
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
                  <button
                    className="btn btn-xs btn-outline gap-1"
                    disabled={busyId === mod.id}
                    title="Exporter le module en .zip"
                    onClick={() => onExport(mod)}
                  >
                    <Download size={12} /> Exporter
                  </button>
                  {mod.custom ? (
                    <>
                      <button
                        className="btn btn-xs btn-outline gap-1"
                        disabled={editLoadingId === mod.id}
                        onClick={() => onEdit(mod)}
                      >
                        <Pencil size={12} /> Modifier
                      </button>
                      <button
                        className="btn btn-xs btn-outline gap-1"
                        disabled={busyId === mod.id}
                        onClick={() => onAddColumn(mod)}
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
                        onClick={() => onDeleteRequest(mod)}
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
  );
}
