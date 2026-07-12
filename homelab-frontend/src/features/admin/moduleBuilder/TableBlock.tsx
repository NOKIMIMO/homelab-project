import { Trash2 } from 'lucide-react';
import type { TableSpec } from '@app/types';
import type { TableSpecOps } from './useTableSpecs';
import ColumnsEditor from './ColumnsEditor';
import RelationsEditor from './RelationsEditor';
import UniqueTogetherEditor from './UniqueTogetherEditor';
import ExternalFetchEditor from './ExternalFetchEditor';
import CustomFunctionsEditor from './CustomFunctionsEditor';

interface Props {
  table: TableSpec;
  tIdx: number;
  otherTableNames: string[];
  canRemove: boolean;
  availableActionTypes: string[];
  ops: TableSpecOps;
}

export default function TableBlock({ table, tIdx, otherTableNames, canRemove, availableActionTypes, ops }: Props) {
  return (
    <div className="border border-base-content/10 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <input
          className="input input-bordered input-sm flex-1 font-mono"
          placeholder="nom_de_table"
          value={table.name}
          onChange={e => ops.updateTable(tIdx, { name: e.target.value })}
        />
        <label className="flex items-center gap-2 text-xs whitespace-nowrap">
          <input
            type="checkbox"
            className="checkbox checkbox-xs"
            checked={table.enableFileStorage}
            onChange={e => ops.updateTable(tIdx, { enableFileStorage: e.target.checked })}
          />
          Stockage de fichier
        </label>
        {canRemove && (
          <button className="btn btn-xs btn-ghost btn-error" onClick={() => ops.removeTable(tIdx)}>
            <Trash2 size={12} />
          </button>
        )}
      </div>

      <ColumnsEditor tIdx={tIdx} columns={table.columns} ops={ops} />
      <RelationsEditor tIdx={tIdx} relations={table.relations} otherTableNames={otherTableNames} ops={ops} />
      <UniqueTogetherEditor tIdx={tIdx} groups={table.uniqueTogether} ops={ops} />
      <ExternalFetchEditor tIdx={tIdx} fetches={table.externalFetches} ops={ops} />
      <CustomFunctionsEditor
        tIdx={tIdx}
        functions={table.customFunctions}
        availableActionTypes={availableActionTypes}
        ops={ops}
      />
    </div>
  );
}
