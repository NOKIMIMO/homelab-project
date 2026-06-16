import { useState, useEffect, useCallback } from 'react';
import { X, Save, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@auth/AuthContext';
import { getApiUrl } from '@lib/api';
import type { ModuleParamsResponse, ParamDeclaration } from '@app/types';

interface Props {
  moduleId: string;
  moduleName: string;
  onClose: () => void;
}

function ParamField({
  decl,
  value,
  onChange,
}: {
  decl: ParamDeclaration;
  value: string;
  onChange: (key: string, val: string) => void;
}) {
  const [revealed, setRevealed] = useState(false);

  if (decl.type === 'boolean') {
    return (
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold">{decl.label}</span>
          {decl.description && (
            <p className="text-xs text-base-content/50 mt-0.5">{decl.description}</p>
          )}
        </div>
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={value === 'true'}
          onChange={e => onChange(decl.key, e.target.checked ? 'true' : 'false')}
        />
      </div>
    );
  }

  if (decl.type === 'secret') {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold">{decl.label}</label>
        {decl.description && (
          <p className="text-xs text-base-content/50">{decl.description}</p>
        )}
        <div className="join w-full">
          <input
            type={revealed ? 'text' : 'password'}
            className="input input-bordered input-sm join-item flex-1"
            placeholder={value === '' ? '(non défini)' : '••••••••'}
            value={value}
            onChange={e => onChange(decl.key, e.target.value)}
          />
          <button
            type="button"
            className="btn btn-sm btn-ghost join-item border border-base-content/20"
            onClick={() => setRevealed(r => !r)}
          >
            {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold">{decl.label}</label>
      {decl.description && (
        <p className="text-xs text-base-content/50">{decl.description}</p>
      )}
      <input
        type={decl.type === 'number' ? 'number' : 'text'}
        className="input input-bordered input-sm w-full"
        value={value}
        onChange={e => onChange(decl.key, e.target.value)}
      />
    </div>
  );
}

export default function ModuleParamsModal({ moduleId, moduleName, onClose }: Props) {
  const { token } = useAuth();
  const [data, setData] = useState<ModuleParamsResponse | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  const headers: HeadersInit = token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };

  const fetchParams = useCallback(async () => {
    const res = await fetch(getApiUrl(`/api/modules/${moduleId}/params`), { headers });
    if (!res.ok) return;
    const json = await res.json() as ModuleParamsResponse;
    setData(json);
    const initial: Record<string, string> = {};
    json.declarations.forEach(d => {
      initial[d.key] = json.values[d.key] ?? d.defaultValue ?? '';
    });
    setDraft(initial);
  }, [moduleId, token]);

  useEffect(() => { void fetchParams(); }, [fetchParams]);

  const handleChange = (key: string, val: string) => {
    setDraft(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(getApiUrl(`/api/modules/${moduleId}/params`), {
        method: 'PUT',
        headers,
        body: JSON.stringify(draft),
      });
      if (res.ok) {
        setSavedOk(true);
        setTimeout(() => setSavedOk(false), 2000);
        const json = await res.json() as ModuleParamsResponse;
        setData(json);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-base-300 rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[85vh]">

        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-content/10">
          <div>
            <h2 className="text-lg font-black">Paramètres</h2>
            <p className="text-xs text-base-content/50 font-mono">{moduleName}</p>
          </div>
          <button className="btn btn-ghost btn-sm btn-square" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {!data ? (
            <div className="flex justify-center py-10">
              <span className="loading loading-bars loading-md text-primary" />
            </div>
          ) : data.declarations.length === 0 ? (
            <p className="text-sm text-base-content/50 text-center py-8">
              Aucun paramètre déclaré pour ce module.
            </p>
          ) : (
            data.declarations.map(decl => (
              <ParamField
                key={decl.key}
                decl={decl}
                value={draft[decl.key] ?? ''}
                onChange={handleChange}
              />
            ))
          )}
        </div>

        {/* footer */}
        {data && data.declarations.length > 0 && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-base-content/10">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              Annuler
            </button>
            <button
              className={`btn btn-sm gap-2 min-w-28 ${savedOk ? 'btn-success' : 'btn-primary'}`}
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? <span className="loading loading-spinner loading-xs" />
                : <Save size={14} />}
              {savedOk ? 'Sauvegardé !' : 'Sauvegarder'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
