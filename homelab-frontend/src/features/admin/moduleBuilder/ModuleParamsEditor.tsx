import { Plus, Trash2 } from 'lucide-react';
import type { ModuleParamSpec } from '@app/types';
import { PARAM_TYPES } from './formDefaults';

interface Props {
  params: ModuleParamSpec[];
  onUpdate: (idx: number, patch: Partial<ModuleParamSpec>) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
}

export default function ModuleParamsEditor({ params, onUpdate, onAdd, onRemove }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold opacity-60">Paramètres du module (clé API, URL de base, ...)</p>
      {params.map((param, pIdx) => (
        <div key={pIdx} className="flex items-center gap-2">
          <input
            className="input input-bordered input-xs flex-1 font-mono"
            placeholder="clé"
            value={param.key}
            onChange={e => onUpdate(pIdx, { key: e.target.value })}
          />
          <input
            className="input input-bordered input-xs flex-1"
            placeholder="Libellé"
            value={param.label}
            onChange={e => onUpdate(pIdx, { label: e.target.value })}
          />
          <select
            className="select select-bordered select-xs"
            value={param.type}
            onChange={e => onUpdate(pIdx, { type: e.target.value as ModuleParamSpec['type'] })}
          >
            {PARAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            className="input input-bordered input-xs flex-1"
            placeholder="Valeur par défaut"
            value={param.defaultValue}
            onChange={e => onUpdate(pIdx, { defaultValue: e.target.value })}
          />
          <button className="btn btn-xs btn-ghost btn-error" onClick={() => onRemove(pIdx)}>
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <button className="btn btn-xs btn-outline gap-1" onClick={onAdd}>
        <Plus size={12} /> Paramètre
      </button>
    </div>
  );
}
