import { useState, useEffect, useCallback } from 'react';
import { Save, RefreshCw, FolderOpen, Puzzle, Home, KeyRound, MessageSquareText } from 'lucide-react';
import { useAuth } from '@auth/AuthContext';
import { getApiUrl } from '@lib/api';
import RecoveryCodeReveal from '@ui/RecoveryCodeReveal';

const LOGIN_DESCRIPTION_MAX_LENGTH = 500;

interface RecoveryCodeStatus {
  exists: boolean;
  createdAt: string | null;
}

interface AppConfig {
  appRoot: string;
  modulesScanPath: string;
  pluginsScanPath: string;
  logLevel: string;
}

const LOG_LEVELS = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'ERROR_DETAILED'] as const;

const LEVEL_COLOR: Record<string, string> = {
  DEBUG:          'text-base-content/60',
  INFO:           'text-info',
  WARN:           'text-warning',
  ERROR:          'text-error',
  ERROR_DETAILED: 'text-error',
};

const PATH_ENTRIES = [
  { key: 'appRoot',          label: 'App Root',          env: 'HOMELAB_APP_ROOT',              icon: Home },
  { key: 'modulesScanPath',  label: 'Modules Scan Path', env: 'HOMELAB_MODULES_SCAN_PATH',     icon: FolderOpen },
  { key: 'pluginsScanPath',  label: 'Plugins Scan Path', env: 'HOMELAB_PLUGINS_SCAN_PATH',     icon: Puzzle },
] as const;

export default function SettingsTab() {
  const { token } = useAuth();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [selectedLevel, setSelectedLevel] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryCodeStatus | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [revealedCode, setRevealedCode] = useState<string | null>(null);
  const [loginDescription, setLoginDescription] = useState('');
  const [savedLoginDescription, setSavedLoginDescription] = useState('');
  const [savingDescription, setSavingDescription] = useState(false);
  const [descriptionSavedOk, setDescriptionSavedOk] = useState(false);

  const headers: HeadersInit = token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };

  const fetchConfig = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(getApiUrl('/api/admin/config'), { headers });
      if (res.ok) {
        const data = await res.json() as AppConfig;
        setConfig(data);
        setSelectedLevel(data.logLevel);
      }
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { void fetchConfig(); }, [fetchConfig]);

  const fetchRecoveryStatus = useCallback(async () => {
    const res = await fetch(getApiUrl('/api/admin/recovery-code/status'), { headers });
    if (res.ok) setRecoveryStatus(await res.json() as RecoveryCodeStatus);
  }, [token]);

  useEffect(() => { void fetchRecoveryStatus(); }, [fetchRecoveryStatus]);

  const fetchLoginDescription = useCallback(async () => {
    const res = await fetch(getApiUrl('/api/auth/login-settings'));
    if (res.ok) {
      const data = await res.json() as { description?: string | null };
      setLoginDescription(data.description ?? '');
      setSavedLoginDescription(data.description ?? '');
    }
  }, []);

  useEffect(() => { void fetchLoginDescription(); }, [fetchLoginDescription]);

  const saveLoginDescription = async () => {
    setSavingDescription(true);
    try {
      const res = await fetch(getApiUrl('/api/admin/login-settings'), {
        method: 'PUT',
        headers,
        body: JSON.stringify({ description: loginDescription }),
      });
      if (res.ok) {
        setSavedLoginDescription(loginDescription);
        setDescriptionSavedOk(true);
        setTimeout(() => setDescriptionSavedOk(false), 2500);
      }
    } finally {
      setSavingDescription(false);
    }
  };

  const regenerateRecoveryCode = async () => {
    setRegenerating(true);
    try {
      const res = await fetch(getApiUrl('/api/admin/recovery-code/regenerate'), { method: 'POST', headers });
      if (res.ok) {
        const data = await res.json() as { code: string };
        setRevealedCode(data.code);
        void fetchRecoveryStatus();
      }
    } finally {
      setRegenerating(false);
    }
  };

  const saveLogLevel = async () => {
    setSaving(true);
    try {
      const res = await fetch(getApiUrl('/api/admin/config/log-level'), {
        method: 'PUT',
        headers,
        body: JSON.stringify({ level: selectedLevel }),
      });
      if (res.ok) {
        setSavedOk(true);
        setTimeout(() => setSavedOk(false), 2500);
        void fetchConfig();
      }
    } finally {
      setSaving(false);
    }
  };

  if (!config) return (
    <div className="flex justify-center pt-20">
      <span className="loading loading-bars loading-md text-primary" />
    </div>
  );

  const levelChanged = selectedLevel !== config.logLevel;

  return (
    <div className="h-full overflow-y-auto space-y-6 max-w-2xl pr-1">

      {/* ── Chemins runtime ── */}
      <div className="card bg-base-300">
        <div className="card-body gap-4">
          <div className="flex items-center justify-between">
            <h2 className="card-title text-base">Configuration Runtime</h2>
            <button
              className="btn btn-xs btn-ghost gap-1"
              onClick={fetchConfig}
              disabled={refreshing}
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>

          {PATH_ENTRIES.map(({ key, label, env, icon: Icon }) => (
            <div key={key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold flex items-center gap-1.5">
                  <Icon size={14} className="opacity-60" />
                  {label}
                </span>
                <span className="text-xs text-base-content/40 font-mono">{env}</span>
              </div>
              <div className="bg-base-200 rounded-lg px-3 py-2 font-mono text-sm text-base-content/70 break-all">
                {config[key as keyof AppConfig]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Niveau de log ── */}
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
              onChange={e => setSelectedLevel(e.target.value)}
            >
              {LOG_LEVELS.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <button
              className={`btn btn-sm gap-2 min-w-28 ${savedOk ? 'btn-success' : 'btn-primary'}`}
              onClick={saveLogLevel}
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
            <span className={`font-mono font-bold ${LEVEL_COLOR[config.logLevel] ?? ''}`}>
              {config.logLevel}
            </span>
          </p>
        </div>
      </div>

      {/* ── Description page de connexion ── */}
      <div className="card bg-base-300">
        <div className="card-body gap-4">
          <h2 className="card-title text-base flex items-center gap-2">
            <MessageSquareText size={16} className="opacity-60" /> Description de la page de connexion
          </h2>
          <p className="text-xs text-base-content/50 -mt-2">
            Le message affiché sur la card de connexion, visible par tous (comme la description
            d'un serveur Minecraft).
          </p>

          <textarea
            className="textarea textarea-bordered w-full text-sm"
            rows={3}
            maxLength={LOGIN_DESCRIPTION_MAX_LENGTH}
            value={loginDescription}
            onChange={e => setLoginDescription(e.target.value)}
            placeholder="Votre espace personnel, hébergé chez vous."
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-base-content/40">
              {loginDescription.length} / {LOGIN_DESCRIPTION_MAX_LENGTH}
            </span>
            <button
              className={`btn btn-sm gap-2 min-w-28 ${descriptionSavedOk ? 'btn-success' : 'btn-primary'}`}
              onClick={() => void saveLoginDescription()}
              disabled={savingDescription || loginDescription === savedLoginDescription}
            >
              {savingDescription
                ? <span className="loading loading-spinner loading-xs" />
                : <Save size={14} />}
              {descriptionSavedOk ? 'Sauvegardé !' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Code de récupération ── */}
      <div className="card bg-base-300">
        <div className="card-body gap-4">
          <h2 className="card-title text-base flex items-center gap-2">
            <KeyRound size={16} className="opacity-60" /> Code de récupération
          </h2>
          <p className="text-xs text-base-content/50 -mt-2">
            Ce code d'urgence permet de réinitialiser tous les comptes et de recréer un compte admin
            en cas de perte d'accès. Régénérer ce code invalide immédiatement l'ancien.
          </p>

          {recoveryStatus && (
            <p className="text-sm">
              {recoveryStatus.exists
                ? <>Code configuré{recoveryStatus.createdAt && <> le <span className="font-mono">{new Date(recoveryStatus.createdAt).toLocaleString()}</span></>}.</>
                : 'Aucun code configuré.'}
            </p>
          )}

          <div>
            <button
              className="btn btn-sm btn-warning gap-2 w-fit"
              onClick={() => void regenerateRecoveryCode()}
              disabled={regenerating}
            >
              {regenerating
                ? <span className="loading loading-spinner loading-xs" />
                : <KeyRound size={14} />}
              Régénérer le code
            </button>
          </div>
        </div>
      </div>

      {/* ── Info ── */}
      <div className="alert bg-base-300 border border-base-content/10 text-xs text-base-content/60">
        <span>
          Les chemins de scan et la configuration base de données sont définis via variables
          d'environnement et nécessitent un redémarrage pour être modifiés.
        </span>
      </div>

      {revealedCode && (
        <RecoveryCodeReveal code={revealedCode} onClose={() => setRevealedCode(null)} />
      )}
    </div>
  );
}
