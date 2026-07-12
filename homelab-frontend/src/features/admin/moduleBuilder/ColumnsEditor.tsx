import { Plus, Trash2 } from 'lucide-react';
import type { ColumnSpec, ColumnType } from '@app/types';
import { COLUMN_TYPES } from './formDefaults';
import type { TableSpecOps } from './useTableSpecs';

interface Props {
  tIdx: number;
  columns: ColumnSpec[];
  ops: Pick<TableSpecOps, 'updateColumn' | 'addColumn' | 'removeColumn'>;
}

export default function ColumnsEditor({ tIdx, columns, ops }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold opacity-60">Colonnes</p>
      {columns.map((col, cIdx) => (
        <div key={cIdx} className="flex items-center gap-2">
          <input
            className="input input-bordered input-xs flex-1 font-mono"
            placeholder="nom_colonne"
            value={col.name}
            onChange={e => ops.updateColumn(tIdx, cIdx, { name: e.target.value })}
          />
          <select
            className="select select-bordered select-xs"
            value={col.type}
            onChange={e => ops.updateColumn(tIdx, cIdx, { type: e.target.value as ColumnType })}
          >
            {COLUMN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <label className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              className="checkbox checkbox-xs"
              checked={!col.nullable}
              onChange={e => ops.updateColumn(tIdx, cIdx, { nullable: !e.target.checked })}
            />
            requis
          </label>
          <label className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              className="checkbox checkbox-xs"
              checked={col.unique}
              onChange={e => ops.updateColumn(tIdx, cIdx, { unique: e.target.checked })}
            />
            unique
          </label>
          <button className="btn btn-xs btn-ghost btn-error" onClick={() => ops.removeColumn(tIdx, cIdx)}>
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <button className="btn btn-xs btn-outline gap-1" onClick={() => ops.addColumn(tIdx)}>
        <Plus size={12} /> Colonne
      </button>
    </div>
  );
}
