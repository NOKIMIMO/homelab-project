import { Plus, Trash2 } from 'lucide-react';
import type { Cardinality, RelationSpec } from '@app/types';
import { CARDINALITIES } from './formDefaults';
import type { TableSpecOps } from './useTableSpecs';

interface Props {
  tIdx: number;
  relations: RelationSpec[];
  otherTableNames: string[];
  ops: Pick<TableSpecOps, 'updateRelation' | 'addRelation' | 'removeRelation'>;
}

export default function RelationsEditor({ tIdx, relations, otherTableNames, ops }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold opacity-60">Relations</p>
      {relations.map((rel, rIdx) => (
        <div key={rIdx} className="flex items-center gap-2">
          <span className="text-xs opacity-50">vers</span>
          <select
            className="select select-bordered select-xs"
            value={rel.targetTable}
            onChange={e => ops.updateRelation(tIdx, rIdx, { targetTable: e.target.value })}
          >
            {otherTableNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select
            className="select select-bordered select-xs"
            value={rel.cardinality}
            onChange={e => ops.updateRelation(tIdx, rIdx, { cardinality: e.target.value as Cardinality })}
          >
            {CARDINALITIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <label className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              className="checkbox checkbox-xs"
              checked={rel.cascadeDelete}
              onChange={e => ops.updateRelation(tIdx, rIdx, { cascadeDelete: e.target.checked })}
            />
            cascade delete
          </label>
          <button className="btn btn-xs btn-ghost btn-error" onClick={() => ops.removeRelation(tIdx, rIdx)}>
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      {otherTableNames.length > 0 && (
        <button className="btn btn-xs btn-outline gap-1" onClick={() => ops.addRelation(tIdx)}>
          <Plus size={12} /> Relation
        </button>
      )}
    </div>
  );
}
