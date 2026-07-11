import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useAuth } from '@auth/AuthContext';
import { getApiUrl } from '@lib/api';
import type { AlertRule, AlertMetric, AlertOperator, AlertSeverity } from '@app/types';

interface Props {
  rule: AlertRule | null;
  onClose: () => void;
  onSaved: (rule: AlertRule) => void;
}

const METRIC_OPTIONS: { value: AlertMetric; label: string; unit: string }[] = [
  { value: 'CPU', label: 'Charge CPU', unit: '%' },
  { value: 'RAM', label: 'Mémoire RAM', unit: '%' },
  { value: 'DISK', label: 'Stockage disque', unit: '%' },
  { value: 'ACTIVE_MODULES', label: 'Modules actifs', unit: 'modules' },
];

const SEVERITY_OPTIONS: { value: AlertSeverity; label: string; btnClass: string }[] = [
  { value: 'INFO', label: 'Info', btnClass: 'btn-info' },
  { value: 'WARNING', label: 'Avertissement', btnClass: 'btn-warning' },
  { value: 'CRITICAL', label: 'Critique', btnClass: 'btn-error' },
];

export default function AlertRuleModal({ rule, onClose, onSaved }: Props) {
  const { token } = useAuth();
  const [name, setName] = useState(rule?.name ?? '');
  const [metric, setMetric] = useState<AlertMetric>(rule?.metric ?? 'CPU');
  const [operator, setOperator] = useState<AlertOperator>(rule?.operator ?? 'ABOVE');
  const [threshold, setThreshold] = useState<string>(rule ? String(rule.threshold) : '80');
  const [severity, setSeverity] = useState<AlertSeverity>(rule?.severity ?? 'WARNING');
  const [enabled, setEnabled] = useState(rule?.enabled ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headers: HeadersInit = token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };

  const unit = METRIC_OPTIONS.find(m => m.value === metric)?.unit ?? '';

  const handleSave = async () => {
    if (name.trim() === '') {
      setError('Le nom est requis.');
      return;
    }
    const thresholdNum = Number(threshold);
    if (Number.isNaN(thresholdNum)) {
      setError('Le seuil doit être un nombre.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const url = rule
        ? getApiUrl(`/api/admin/alerts/${rule.id}`)
        : getApiUrl('/api/admin/alerts');
      const res = await fetch(url, {
        method: rule ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify({ name, metric, operator, threshold: thresholdNum, severity, enabled }),
      });
      if (!res.ok) {
        setError("Échec de l'enregistrement de la règle.");
        return;
      }
      const json = await res.json() as AlertRule;
      onSaved(json);
      onClose();
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
            <h2 className="text-lg font-black">{rule ? "Modifier l'alerte" : 'Nouvelle alerte'}</h2>
            <p className="text-xs text-base-content/50">Seuil personnalisé sur une métrique du homelab</p>
          </div>
          <button className="btn btn-ghost btn-sm btn-square" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold">Nom</label>
            <input
              type="text"
              className="input input-bordered input-sm w-full"
              placeholder="Ex: CPU en surcharge"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold">Métrique</label>
            <select
              className="select select-bordered select-sm w-full"
              value={metric}
              onChange={e => setMetric(e.target.value as AlertMetric)}
            >
              {METRIC_OPTIONS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-semibold">Condition</label>
              <select
                className="select select-bordered select-sm w-full"
                value={operator}
                onChange={e => setOperator(e.target.value as AlertOperator)}
              >
                <option value="ABOVE">Au-dessus de</option>
                <option value="BELOW">En-dessous de</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-semibold">Seuil ({unit})</label>
              <input
                type="number"
                className="input input-bordered input-sm w-full"
                value={threshold}
                onChange={e => setThreshold(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold">Criticité</label>
            <div className="join">
              {SEVERITY_OPTIONS.map(s => (
                <button
                  key={s.value}
                  type="button"
                  className={`btn btn-sm join-item flex-1 ${severity === s.value ? s.btnClass : 'btn-outline'}`}
                  onClick={() => setSeverity(s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Activée</span>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={enabled}
              onChange={e => setEnabled(e.target.checked)}
            />
          </div>

          {error && <p className="text-xs text-error">{error}</p>}
        </div>

        {/* footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-base-content/10">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Annuler
          </button>
          <button
            className="btn btn-sm btn-primary gap-2 min-w-28"
            onClick={handleSave}
            disabled={saving}
          >
            {saving
              ? <span className="loading loading-spinner loading-xs" />
              : <Save size={14} />}
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}
