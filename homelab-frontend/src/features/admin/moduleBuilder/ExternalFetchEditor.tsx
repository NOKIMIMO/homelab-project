import { Plus, Trash2 } from 'lucide-react';
import type { ExternalFetchSpec } from '@app/types';
import { HTTP_METHODS } from './formDefaults';
import type { TableSpecOps } from './useTableSpecs';

interface Props {
  tIdx: number;
  fetches: ExternalFetchSpec[];
  ops: Pick<TableSpecOps, 'updateFetch' | 'addFetch' | 'removeFetch' | 'updateFetchQueryParams' | 'mappingRow' | 'addMappingRow' | 'removeMappingRow'>;
}

export default function ExternalFetchEditor({ tIdx, fetches, ops }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold opacity-60">Fonctions d'appel API externe</p>
      {fetches.map((fetch, fIdx) => (
        <div key={fIdx} className="border border-base-content/10 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              className="input input-bordered input-xs flex-1 font-mono"
              placeholder="nomDeLaFonction"
              value={fetch.functionName}
              onChange={e => ops.updateFetch(tIdx, fIdx, { functionName: e.target.value })}
            />
            <input
              className="input input-bordered input-xs flex-[2]"
              placeholder="Description"
              value={fetch.description}
              onChange={e => ops.updateFetch(tIdx, fIdx, { description: e.target.value })}
            />
            <button className="btn btn-xs btn-ghost btn-error" onClick={() => ops.removeFetch(tIdx, fIdx)}>
              <Trash2 size={12} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              className="select select-bordered select-xs"
              value={fetch.method}
              onChange={e => ops.updateFetch(tIdx, fIdx, { method: e.target.value })}
            >
              {HTTP_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input
              className="input input-bordered input-xs flex-1 font-mono"
              placeholder="https://api.exemple.com/v1?q={query}&appid={apiKey}"
              value={fetch.urlTemplate}
              onChange={e => ops.updateFetch(tIdx, fIdx, { urlTemplate: e.target.value })}
            />
          </div>
          <p className="text-[11px] opacity-50">
            {'{nom}'} dans l'URL est remplacé par un paramètre d'appel ou une valeur des paramètres du module.
          </p>

          <div className="flex items-center gap-2">
            <input
              className="input input-bordered input-xs flex-1 font-mono"
              placeholder="paramètres d'appel: query,city"
              defaultValue={fetch.queryParams.join(',')}
              onBlur={e => ops.updateFetchQueryParams(tIdx, fIdx, e.target.value)}
            />
            <input
              className="input input-bordered input-xs flex-1 font-mono"
              placeholder="colonne clé d'upsert (optionnel)"
              value={fetch.upsertKey ?? ''}
              onChange={e => ops.updateFetch(tIdx, fIdx, { upsertKey: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <p className="text-[11px] opacity-50">Mapping colonne → chemin JSON (ex: main.temp, weather[0].description)</p>
            {Object.entries(fetch.responseMapping).map(([key, value], rowIdx) => (
              <div key={rowIdx} className="flex items-center gap-2">
                <input
                  className="input input-bordered input-xs flex-1 font-mono"
                  placeholder="colonne"
                  value={key}
                  onChange={e => ops.mappingRow(tIdx, fIdx, rowIdx, e.target.value, value)}
                />
                <input
                  className="input input-bordered input-xs flex-1 font-mono"
                  placeholder="chemin.json[0]"
                  value={value}
                  onChange={e => ops.mappingRow(tIdx, fIdx, rowIdx, key, e.target.value)}
                />
                <button className="btn btn-xs btn-ghost btn-error" onClick={() => ops.removeMappingRow(tIdx, fIdx, key)}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button className="btn btn-xs btn-outline gap-1" onClick={() => ops.addMappingRow(tIdx, fIdx)}>
              <Plus size={12} /> Mapping
            </button>
          </div>
        </div>
      ))}
      <button className="btn btn-xs btn-outline gap-1" onClick={() => ops.addFetch(tIdx)}>
        <Plus size={12} /> Fonction API externe
      </button>
    </div>
  );
}
