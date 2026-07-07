import { useState } from 'react';
import { Plus, Trash2, X, Save } from 'lucide-react';
import { useAuth } from '@auth/AuthContext';
import { getApiUrl } from '@lib/api';
import type {
  Cardinality,
  ColumnSpec,
  ColumnType,
  ExternalFetchSpec,
  ModuleBuilderRequest,
  ModuleParamSpec,
  RelationSpec,
  TableSpec,
} from '@app/types';

const COLUMN_TYPES: ColumnType[] = ['string', 'int', 'long', 'boolean', 'date', 'datetime'];
const CARDINALITIES: { value: Cardinality; label: string }[] = [
  { value: 'ONE_TO_MANY', label: 'Un vers plusieurs' },
  { value: 'MANY_TO_ONE', label: 'Plusieurs vers un' },
  { value: 'ONE_TO_ONE', label: 'Un vers un' },
  { value: 'MANY_TO_MANY', label: 'Plusieurs vers plusieurs' },
];
const PARAM_TYPES: ModuleParamSpec['type'][] = ['string', 'secret', 'boolean', 'number'];

const emptyColumn = (): ColumnSpec => ({ name: '', type: 'string', nullable: true, unique: false });
const emptyRelation = (defaultTarget: string): RelationSpec => ({
  targetTable: defaultTarget,
  cardinality: 'ONE_TO_MANY',
  cascadeDelete: false,
});

const emptyFetch = (): ExternalFetchSpec => ({
  functionName: '',
  description: '',
  urlTemplate: '',
  queryParams: [],
  responseMapping: {},
  upsertKey: '',
});
const emptyParam = (): ModuleParamSpec => ({ key: '', label: '', type: 'string', defaultValue: '', description: '' });
const emptyTable = (): TableSpec => ({
  name: '',
  columns: [emptyColumn()],
  enableFileStorage: false,
  relations: [],
  uniqueTogether: [],
  externalFetches: [],
});

// Stamps each table/column with its current name as previousName, frozen at load time, so the
// backend can tell a rename (name changed, previousName still matches an existing one) apart
// from a brand-new table/column (no matching previousName). Only meaningful when editing.
const stampPreviousNames = (tables: TableSpec[]): TableSpec[] =>
  tables.map(t => ({
    ...t,
    previousName: t.name,
    columns: t.columns.map(c => ({ ...c, previousName: c.name })),
  }));

interface Props {
  onClose: () => void;
  onCreated: () => void;
  initialSpec?: ModuleBuilderRequest;
}

export default function CreateModuleForm({ onClose, onCreated, initialSpec }: Props) {
  const isEditing = initialSpec !== undefined;
  const { token } = useAuth();
  const [id, setId] = useState(initialSpec?.id ?? '');
  const [name, setName] = useState(initialSpec?.name ?? '');
  const [description, setDescription] = useState(initialSpec?.description ?? '');
  const [tables, setTables] = useState<TableSpec[]>(
    initialSpec ? stampPreviousNames(initialSpec.tables) : [emptyTable()]
  );
  const [params, setParams] = useState<ModuleParamSpec[]>(initialSpec?.params ?? []);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const headers: HeadersInit = token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };

  const otherTableNames = (idx: number) =>
    tables.filter((_, i) => i !== idx).map(t => t.name).filter(Boolean);

  const updateTable = (idx: number, patch: Partial<TableSpec>) => {
    setTables(prev => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  };

  const addTable = () => setTables(prev => [...prev, emptyTable()]);
  const removeTable = (idx: number) => setTables(prev => prev.filter((_, i) => i !== idx));

  const updateColumn = (tIdx: number, cIdx: number, patch: Partial<ColumnSpec>) => {
    setTables(prev => prev.map((t, i) => {
      if (i !== tIdx) return t;
      return { ...t, columns: t.columns.map((c, j) => (j === cIdx ? { ...c, ...patch } : c)) };
    }));
  };
  const addColumn = (tIdx: number) => updateTable(tIdx, { columns: [...tables[tIdx].columns, emptyColumn()] });
  const removeColumn = (tIdx: number, cIdx: number) =>
    updateTable(tIdx, { columns: tables[tIdx].columns.filter((_, j) => j !== cIdx) });

  const updateRelation = (tIdx: number, rIdx: number, patch: Partial<RelationSpec>) => {
    setTables(prev => prev.map((t, i) => {
      if (i !== tIdx) return t;
      return { ...t, relations: t.relations.map((r, j) => (j === rIdx ? { ...r, ...patch } : r)) };
    }));
  };
  const addRelation = (tIdx: number) => {
    const target = otherTableNames(tIdx)[0] ?? '';
    updateTable(tIdx, { relations: [...tables[tIdx].relations, emptyRelation(target)] });
  };
  const removeRelation = (tIdx: number, rIdx: number) =>
    updateTable(tIdx, { relations: tables[tIdx].relations.filter((_, j) => j !== rIdx) });

  const updateUniqueGroup = (tIdx: number, gIdx: number, raw: string) => {
    setTables(prev => prev.map((t, i) => {
      if (i !== tIdx) return t;
      const groups = [...t.uniqueTogether];
      groups[gIdx] = raw.split(',').map(s => s.trim()).filter(Boolean);
      return { ...t, uniqueTogether: groups };
    }));
  };
  const addUniqueGroup = (tIdx: number) => updateTable(tIdx, { uniqueTogether: [...tables[tIdx].uniqueTogether, []] });
  const removeUniqueGroup = (tIdx: number, gIdx: number) =>
    updateTable(tIdx, { uniqueTogether: tables[tIdx].uniqueTogether.filter((_, j) => j !== gIdx) });

  const updateFetch = (tIdx: number, fIdx: number, patch: Partial<ExternalFetchSpec>) => {
    setTables(prev => prev.map((t, i) => {
      if (i !== tIdx) return t;
      return { ...t, externalFetches: t.externalFetches.map((f, j) => (j === fIdx ? { ...f, ...patch } : f)) };
    }));
  };
  const addFetch = (tIdx: number) => updateTable(tIdx, { externalFetches: [...tables[tIdx].externalFetches, emptyFetch()] });
  const removeFetch = (tIdx: number, fIdx: number) =>
    updateTable(tIdx, { externalFetches: tables[tIdx].externalFetches.filter((_, j) => j !== fIdx) });

  const updateFetchQueryParams = (tIdx: number, fIdx: number, raw: string) =>
    updateFetch(tIdx, fIdx, { queryParams: raw.split(',').map(s => s.trim()).filter(Boolean) });

  const mappingRow = (tIdx: number, fIdx: number, rowIdx: number, key: string, value: string) => {
    const fetch = tables[tIdx].externalFetches[fIdx];
    const entries = Object.entries(fetch.responseMapping);
    entries[rowIdx] = [key, value];
    updateFetch(tIdx, fIdx, { responseMapping: Object.fromEntries(entries) });
  };
  const addMappingRow = (tIdx: number, fIdx: number) => {
    const fetch = tables[tIdx].externalFetches[fIdx];
    updateFetch(tIdx, fIdx, { responseMapping: { ...fetch.responseMapping, '': '' } });
  };
  const removeMappingRow = (tIdx: number, fIdx: number, key: string) => {
    const fetch = tables[tIdx].externalFetches[fIdx];
    const entries = Object.entries(fetch.responseMapping).filter(([k]) => k !== key);
    updateFetch(tIdx, fIdx, { responseMapping: Object.fromEntries(entries) });
  };

  const updateParam = (idx: number, patch: Partial<ModuleParamSpec>) =>
    setParams(prev => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  const addParam = () => setParams(prev => [...prev, emptyParam()]);
  const removeParam = (idx: number) => setParams(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const body: ModuleBuilderRequest = {
        id: id.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        tables: tables.map(t => ({
          ...t,
          name: t.name.trim(),
          columns: t.columns.filter(c => c.name.trim()).map(c => ({ ...c, name: c.name.trim() })),
          uniqueTogether: t.uniqueTogether.filter(g => g.length >= 2),
          externalFetches: t.externalFetches
            .filter(f => f.functionName.trim() && f.urlTemplate.trim() && Object.keys(f.responseMapping).some(k => k.trim()))
            .map(f => ({
              ...f,
              functionName: f.functionName.trim(),
              responseMapping: Object.fromEntries(
                Object.entries(f.responseMapping).filter(([k]) => k.trim())
              ),
              upsertKey: f.upsertKey?.trim() || undefined,
            })),
        })),
        params: params.filter(p => p.key.trim() && p.label.trim()).map(p => ({ ...p, key: p.key.trim() })),
      };

      const res = await fetch(
        isEditing ? getApiUrl(`/api/admin/module-builder/${id.trim()}`) : getApiUrl('/api/admin/module-builder'),
        {
          method: isEditing ? 'PUT' : 'POST',
          headers,
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const errBody = await res.json().catch(() => null) as { error?: string } | null;
        setError(errBody?.error ?? `Échec de ${isEditing ? "la modification" : "la création"} (${res.status})`);
        return;
      }

      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-base-300 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between px-6 py-4 border-b border-base-content/10">
          <h2 className="text-lg font-black">{isEditing ? `Modifier ${initialSpec.name}` : 'Créer un module'}</h2>
          <button className="btn btn-ghost btn-sm btn-square" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Identifiant</label>
              <input
                className="input input-bordered input-sm w-full font-mono disabled:opacity-60"
                placeholder="mon_module"
                value={id}
                disabled={isEditing}
                onChange={e => setId(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Nom</label>
              <input
                className="input input-bordered input-sm w-full"
                placeholder="Mon Module"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-sm font-semibold">Description</label>
              <input
                className="input input-bordered input-sm w-full"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Module-level parameters (params.json) */}
          <div className="space-y-2">
            <p className="text-xs font-semibold opacity-60">Paramètres du module (clé API, URL de base, ...)</p>
            {params.map((param, pIdx) => (
              <div key={pIdx} className="flex items-center gap-2">
                <input
                  className="input input-bordered input-xs flex-1 font-mono"
                  placeholder="clé"
                  value={param.key}
                  onChange={e => updateParam(pIdx, { key: e.target.value })}
                />
                <input
                  className="input input-bordered input-xs flex-1"
                  placeholder="Libellé"
                  value={param.label}
                  onChange={e => updateParam(pIdx, { label: e.target.value })}
                />
                <select
                  className="select select-bordered select-xs"
                  value={param.type}
                  onChange={e => updateParam(pIdx, { type: e.target.value as ModuleParamSpec['type'] })}
                >
                  {PARAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input
                  className="input input-bordered input-xs flex-1"
                  placeholder="Valeur par défaut"
                  value={param.defaultValue}
                  onChange={e => updateParam(pIdx, { defaultValue: e.target.value })}
                />
                <button className="btn btn-xs btn-ghost btn-error" onClick={() => removeParam(pIdx)}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button className="btn btn-xs btn-outline gap-1" onClick={addParam}>
              <Plus size={12} /> Paramètre
            </button>
          </div>

          {isEditing && (
            <p className="text-[11px] opacity-50">
              Renommer une table/colonne est appliqué en place. Retyper une colonne tente une conversion des données existantes (peut échouer si incompatible). Supprimer une table ou une colonne existante n'est pas supporté ici.
            </p>
          )}

          <div className="space-y-4">
            {tables.map((table, tIdx) => (
              <div key={tIdx} className="border border-base-content/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    className="input input-bordered input-sm flex-1 font-mono"
                    placeholder="nom_de_table"
                    value={table.name}
                    onChange={e => updateTable(tIdx, { name: e.target.value })}
                  />
                  <label className="flex items-center gap-2 text-xs whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-xs"
                      checked={table.enableFileStorage}
                      onChange={e => updateTable(tIdx, { enableFileStorage: e.target.checked })}
                    />
                    Stockage de fichier
                  </label>
                  {tables.length > 1 && (
                    <button className="btn btn-xs btn-ghost btn-error" onClick={() => removeTable(tIdx)}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>

                {/* Columns */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold opacity-60">Colonnes</p>
                  {table.columns.map((col, cIdx) => (
                    <div key={cIdx} className="flex items-center gap-2">
                      <input
                        className="input input-bordered input-xs flex-1 font-mono"
                        placeholder="nom_colonne"
                        value={col.name}
                        onChange={e => updateColumn(tIdx, cIdx, { name: e.target.value })}
                      />
                      <select
                        className="select select-bordered select-xs"
                        value={col.type}
                        onChange={e => updateColumn(tIdx, cIdx, { type: e.target.value as ColumnType })}
                      >
                        {COLUMN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-xs"
                          checked={!col.nullable}
                          onChange={e => updateColumn(tIdx, cIdx, { nullable: !e.target.checked })}
                        />
                        requis
                      </label>
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-xs"
                          checked={col.unique}
                          onChange={e => updateColumn(tIdx, cIdx, { unique: e.target.checked })}
                        />
                        unique
                      </label>
                      <button className="btn btn-xs btn-ghost btn-error" onClick={() => removeColumn(tIdx, cIdx)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  <button className="btn btn-xs btn-outline gap-1" onClick={() => addColumn(tIdx)}>
                    <Plus size={12} /> Colonne
                  </button>
                </div>

                {/* Relations */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold opacity-60">Relations</p>
                  {table.relations.map((rel, rIdx) => (
                    <div key={rIdx} className="flex items-center gap-2">
                      <span className="text-xs opacity-50">vers</span>
                      <select
                        className="select select-bordered select-xs"
                        value={rel.targetTable}
                        onChange={e => updateRelation(tIdx, rIdx, { targetTable: e.target.value })}
                      >
                        {otherTableNames(tIdx).map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                      <select
                        className="select select-bordered select-xs"
                        value={rel.cardinality}
                        onChange={e => updateRelation(tIdx, rIdx, { cardinality: e.target.value as Cardinality })}
                      >
                        {CARDINALITIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-xs"
                          checked={rel.cascadeDelete}
                          onChange={e => updateRelation(tIdx, rIdx, { cascadeDelete: e.target.checked })}
                        />
                        cascade delete
                      </label>
                      <button className="btn btn-xs btn-ghost btn-error" onClick={() => removeRelation(tIdx, rIdx)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  {otherTableNames(tIdx).length > 0 && (
                    <button className="btn btn-xs btn-outline gap-1" onClick={() => addRelation(tIdx)}>
                      <Plus size={12} /> Relation
                    </button>
                  )}
                </div>

                {/* Unique together */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold opacity-60">Contraintes d'unicité combinée</p>
                  {table.uniqueTogether.map((group, gIdx) => (
                    <div key={gIdx} className="flex items-center gap-2">
                      <input
                        className="input input-bordered input-xs flex-1 font-mono"
                        placeholder="colonne1,colonne2"
                        defaultValue={group.join(',')}
                        onBlur={e => updateUniqueGroup(tIdx, gIdx, e.target.value)}
                      />
                      <button className="btn btn-xs btn-ghost btn-error" onClick={() => removeUniqueGroup(tIdx, gIdx)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  <button className="btn btn-xs btn-outline gap-1" onClick={() => addUniqueGroup(tIdx)}>
                    <Plus size={12} /> Groupe unique
                  </button>
                </div>

                {/* External API fetch functions (FETCH_EXTERNAL_GENERIC), like the weather module */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold opacity-60">Fonctions d'appel API externe</p>
                  {table.externalFetches.map((fetch, fIdx) => (
                    <div key={fIdx} className="border border-base-content/10 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          className="input input-bordered input-xs flex-1 font-mono"
                          placeholder="nomDeLaFonction"
                          value={fetch.functionName}
                          onChange={e => updateFetch(tIdx, fIdx, { functionName: e.target.value })}
                        />
                        <input
                          className="input input-bordered input-xs flex-[2]"
                          placeholder="Description"
                          value={fetch.description}
                          onChange={e => updateFetch(tIdx, fIdx, { description: e.target.value })}
                        />
                        <button className="btn btn-xs btn-ghost btn-error" onClick={() => removeFetch(tIdx, fIdx)}>
                          <Trash2 size={12} />
                        </button>
                      </div>

                      <input
                        className="input input-bordered input-xs w-full font-mono"
                        placeholder="https://api.exemple.com/v1?q={query}&appid={apiKey}"
                        value={fetch.urlTemplate}
                        onChange={e => updateFetch(tIdx, fIdx, { urlTemplate: e.target.value })}
                      />
                      <p className="text-[11px] opacity-50">
                        {'{nom}'} dans l'URL est remplacé par un paramètre d'appel ou une valeur des paramètres du module.
                      </p>

                      <div className="flex items-center gap-2">
                        <input
                          className="input input-bordered input-xs flex-1 font-mono"
                          placeholder="paramètres d'appel: query,city"
                          defaultValue={fetch.queryParams.join(',')}
                          onBlur={e => updateFetchQueryParams(tIdx, fIdx, e.target.value)}
                        />
                        <input
                          className="input input-bordered input-xs flex-1 font-mono"
                          placeholder="colonne clé d'upsert (optionnel)"
                          value={fetch.upsertKey ?? ''}
                          onChange={e => updateFetch(tIdx, fIdx, { upsertKey: e.target.value })}
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
                              onChange={e => mappingRow(tIdx, fIdx, rowIdx, e.target.value, value)}
                            />
                            <input
                              className="input input-bordered input-xs flex-1 font-mono"
                              placeholder="chemin.json[0]"
                              value={value}
                              onChange={e => mappingRow(tIdx, fIdx, rowIdx, key, e.target.value)}
                            />
                            <button className="btn btn-xs btn-ghost btn-error" onClick={() => removeMappingRow(tIdx, fIdx, key)}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                        <button className="btn btn-xs btn-outline gap-1" onClick={() => addMappingRow(tIdx, fIdx)}>
                          <Plus size={12} /> Mapping
                        </button>
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-xs btn-outline gap-1" onClick={() => addFetch(tIdx)}>
                    <Plus size={12} /> Fonction API externe
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-sm btn-outline gap-1" onClick={addTable}>
            <Plus size={14} /> Ajouter une table
          </button>

          {error && <p className="text-sm text-error">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-base-content/10">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Annuler</button>
          <button
            className="btn btn-sm btn-primary gap-2 min-w-28"
            onClick={handleSubmit}
            disabled={submitting || !id.trim() || !name.trim() || tables.some(t => !t.name.trim())}
          >
            {submitting ? <span className="loading loading-spinner loading-xs" /> : <Save size={14} />}
            {isEditing ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  );
}
