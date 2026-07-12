import { Plus, Trash2 } from 'lucide-react';
import type { DependencySpec, Module } from '@app/types';

interface Props {
  dependencies: DependencySpec[];
  otherModules: Module[];
  onUpdate: (idx: number, patch: Partial<DependencySpec>) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
}

export default function DependencyPicker({ dependencies, otherModules, onUpdate, onAdd, onRemove }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold opacity-60">Dépendances (modules existants)</p>
      {dependencies.map((dep, dIdx) => (
        <div key={dIdx} className="flex items-center gap-2">
          <select
            className="select select-bordered select-xs flex-1"
            value={dep.moduleId}
            onChange={e => onUpdate(dIdx, { moduleId: e.target.value })}
          >
            {otherModules.map(m => <option key={m.id} value={m.id}>{m.name} ({m.id})</option>)}
          </select>
          <input
            className="input input-bordered input-xs flex-1 font-mono"
            placeholder="^1.0.0 ou *"
            value={dep.version}
            onChange={e => onUpdate(dIdx, { version: e.target.value })}
          />
          <button className="btn btn-xs btn-ghost btn-error" onClick={() => onRemove(dIdx)}>
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      {otherModules.length > 0 && (
        <button className="btn btn-xs btn-outline gap-1" onClick={onAdd}>
          <Plus size={12} /> Dépendance
        </button>
      )}
    </div>
  );
}
