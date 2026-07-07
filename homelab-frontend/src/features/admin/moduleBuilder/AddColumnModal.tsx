import { useState } from 'react';
import { Save, X } from 'lucide-react';
import { useAuth } from '@auth/AuthContext';
import { getApiUrl } from '@lib/api';
import type { ColumnType, ModuleSchemaResponse } from '@app/types';

const COLUMN_TYPES: ColumnType[] = ['string', 'int', 'long', 'boolean', 'date', 'datetime'];

interface Props {
  moduleId: string;
  schema: ModuleSchemaResponse;
  onClose: () => void;
  onUpdated: () => void;
}

export default function AddColumnModal({ moduleId, schema, onClose, onUpdated }: Props) {
  const { token } = useAuth();
  const [tableName, setTableName] = useState(schema.tables[0]?.name ?? '');
  const [columnName, setColumnName] = useState('');
  const [type, setType] = useState<ColumnType>('string');
  const [unique, setUnique] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const headers: HeadersInit = token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(
        getApiUrl(`/api/admin/module-builder/${moduleId}/tables/${tableName}/columns`),
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            tableName,
            column: { name: columnName.trim(), type, nullable: true, unique },
          }),
        }
      );

      if (!res.ok) {
        const errBody = await res.json().catch(() => null) as { error?: string } | null;
        setError(errBody?.error ?? `Échec de l'ajout (${res.status})`);
        return;
      }

      onUpdated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-base-300 rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh]">

        <div className="flex items-center justify-between px-6 py-4 border-b border-base-content/10">
          <div>
            <h2 className="text-lg font-black">Ajouter une colonne</h2>
            <p className="text-xs text-base-content/50 font-mono">{schema.name}</p>
          </div>
          <button className="btn btn-ghost btn-sm btn-square" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold">Table</label>
            <select
              className="select select-bordered select-sm w-full"
              value={tableName}
              onChange={e => setTableName(e.target.value)}
            >
              {schema.tables.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold">Nom de la colonne</label>
            <input
              className="input input-bordered input-sm w-full font-mono"
              value={columnName}
              onChange={e => setColumnName(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-semibold">Type</label>
              <select
                className="select select-bordered select-sm w-full"
                value={type}
                onChange={e => setType(e.target.value as ColumnType)}
              >
                {COLUMN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm pt-6">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={unique}
                onChange={e => setUnique(e.target.checked)}
              />
              Unique
            </label>
          </div>

          <p className="text-xs text-base-content/50">
            Les colonnes ajoutées après la création d'une table sont toujours facultatives :
            Postgres refuse une contrainte "requise" sur une table qui contient déjà des lignes.
          </p>

          {error && <p className="text-sm text-error">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-base-content/10">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Annuler</button>
          <button
            className="btn btn-sm btn-primary gap-2 min-w-28"
            onClick={handleSubmit}
            disabled={submitting || !columnName.trim() || !tableName}
          >
            {submitting ? <span className="loading loading-spinner loading-xs" /> : <Save size={14} />}
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}
