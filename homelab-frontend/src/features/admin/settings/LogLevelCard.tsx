import { Save } from 'lucide-react';

const LOG_LEVELS = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'ERROR_DETAILED'] as const;

const LEVEL_COLOR: Record<string, string> = {
  DEBUG:          'text-base-content/60',
  INFO:           'text-info',
  WARN:           'text-warning',
  ERROR:          'text-error',
  ERROR_DETAILED: 'text-error',
};

interface Props {
  currentLevel: string;
  selectedLevel: string;
  saving: boolean;
  savedOk: boolean;
  onChange: (level: string) => void;
  onSave: () => void;
}

export default function LogLevelCard({ currentLevel, selectedLevel, saving, savedOk, onChange, onSave }: Props) {
  const levelChanged = selectedLevel !== currentLevel;

  return (
    <div className="card bg-base-300">
      <div className="card-body gap-4">
        <h2 className="card-title text-base">Niveau de Log</h2>
        <p className="text-xs text-base-content/50 -mt-2">
          Modifie la verbosité en temps réel, sans redémarrage.
        </p>

        <div className="flex items-center gap-3">
          <select
            className="select select-bordered select-sm flex-1"
            value={selectedLevel}
            onChange={e => onChange(e.target.value)}
          >
            {LOG_LEVELS.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <button
            className={`btn btn-sm gap-2 min-w-28 ${savedOk ? 'btn-success' : 'btn-primary'}`}
            onClick={onSave}
            disabled={saving || !levelChanged}
          >
            {saving
              ? <span className="loading loading-spinner loading-xs" />
              : <Save size={14} />}
            {savedOk ? 'Sauvegardé !' : 'Appliquer'}
          </button>
        </div>

        <p className="text-xs text-base-content/50">
          Niveau actuel :&nbsp;
          <span className={`font-mono font-bold ${LEVEL_COLOR[currentLevel] ?? ''}`}>
            {currentLevel}
          </span>
        </p>
      </div>
    </div>
  );
}
