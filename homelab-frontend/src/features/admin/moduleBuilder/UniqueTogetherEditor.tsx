import { Plus, Trash2 } from 'lucide-react';
import type { TableSpecOps } from './useTableSpecs';

interface Props {
  tIdx: number;
  groups: string[][];
  ops: Pick<TableSpecOps, 'updateUniqueGroup' | 'addUniqueGroup' | 'removeUniqueGroup'>;
}

export default function UniqueTogetherEditor({ tIdx, groups, ops }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold opacity-60">Contraintes d'unicité combinée</p>
      {groups.map((group, gIdx) => (
        <div key={gIdx} className="flex items-center gap-2">
          <input
            className="input input-bordered input-xs flex-1 font-mono"
            placeholder="colonne1,colonne2"
            defaultValue={group.join(',')}
            onBlur={e => ops.updateUniqueGroup(tIdx, gIdx, e.target.value)}
          />
          <button className="btn btn-xs btn-ghost btn-error" onClick={() => ops.removeUniqueGroup(tIdx, gIdx)}>
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <button className="btn btn-xs btn-outline gap-1" onClick={() => ops.addUniqueGroup(tIdx)}>
        <Plus size={12} /> Groupe unique
      </button>
    </div>
  );
}
