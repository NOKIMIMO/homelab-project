import { Trash2 } from 'lucide-react';
import type { ModuleBuilderSummary } from '@app/types';

interface Props {
  pendingDelete: ModuleBuilderSummary;
  dropData: boolean;
  busy: boolean;
  onChangeDropData: (dropData: boolean) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteModuleModal({ pendingDelete, dropData, busy, onChangeDropData, onCancel, onConfirm }: Props) {
  return (
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
            onChange={e => onChangeDropData(e.target.checked)}
          />
          Supprimer aussi les données stockées (irréversible)
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>
            Annuler
          </button>
          <button
            className="btn btn-sm btn-error gap-2"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy
              ? <span className="loading loading-spinner loading-xs" />
              : <Trash2 size={14} />}
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
