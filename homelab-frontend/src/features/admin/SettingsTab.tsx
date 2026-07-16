import { useState, useEffect, useCallback, useRef } from 'react';
import { Save, RefreshCw, FolderOpen, Puzzle, Home, KeyRound, MessageSquareText, Gauge, AlertTriangle, Power, Sparkles, Image as ImageIcon, Upload, Trash2 } from 'lucide-react';
import { useAuth } from '@auth/AuthContext';
import { getApiUrl } from '@lib/api';
import RecoveryCodeReveal from '@ui/RecoveryCodeReveal';
import { applyBranding, appIconUrl, DEFAULT_APP_NAME } from '@lib/branding';
import type { ResourceLimitsStatus } from '@app/types';

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
  restartAvailable: boolean;
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
  const [appName, setAppName] = useState('');
  const [savedAppName, setSavedAppName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameSavedOk, setNameSavedOk] = useState(false);
  const [hasAppIcon, setHasAppIcon] = useState(false);
  const [iconCacheBust, setIconCacheBust] = useState(0);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [removingIcon, setRemovingIcon] = useState(false);
  const [iconError, setIconError] = useState<string | null>(null);
  const iconFileInputRef = useRef<HTMLInputElement>(null);
  const [limits, setLimits] = useState<ResourceLimitsStatus | null>(null);
  const [ramInput, setRamInput] = useState('');
  const [diskInput, setDiskInput] = useState('');
  const [savingLimits, setSavingLimits] = useState(false);
  const [limitsSavedOk, setLimitsSavedOk] = useState(false);
  const [limitsError, setLimitsError] = useState<string | null>(null);
  const [restartOpen, setRestartOpen] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [restartError, setRestartError] = useState<string | null>(null);
  const [restartTriggered, setRestartTriggered] = useState(false);

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
      const data = await res.json() as { description?: string | null; appName?: string | null; hasAppIcon?: boolean };
      setLoginDescription(data.description ?? '');
      setSavedLoginDescription(data.description ?? '');
      setAppName(data.appName ?? '');
      setSavedAppName(data.appName ?? '');
      setHasAppIcon(data.hasAppIcon ?? false);
    }
  }, []);

  useEffect(() => { void fetchLoginDescription(); }, [fetchLoginDescription]);

  const saveAppName = async () => {
    setSavingName(true);
    try {
      const res = await fetch(getApiUrl('/api/admin/login-settings'), {
        method: 'PUT',
        headers,
        body: JSON.stringify({ appName }),
      });
      if (res.ok) {
        const data = await res.json() as { appName?: string | null };
        setSavedAppName(data.appName ?? '');
        applyBranding({ appName: data.appName, hasAppIcon }, iconCacheBust);
        setNameSavedOk(true);
        setTimeout(() => setNameSavedOk(false), 2500);
      }
    } finally {
      setSavingName(false);
    }
  };

  const uploadAppIcon = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setIconError('Le fichier doit être une image.');
      return;
    }
    setIconError(null);
    setUploadingIcon(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(getApiUrl('/api/admin/login-settings/icon'), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      if (res.ok) {
        const bust = Date.now();
        setHasAppIcon(true);
        setIconCacheBust(bust);
        applyBranding({ appName: savedAppName, hasAppIcon: true }, bust);
      } else {
        const err = await res.json().catch(() => null) as { error?: string } | null;
        setIconError(err?.error ?? "Échec de l'envoi de l'image");
      }
    } finally {
      setUploadingIcon(false);
    }
  };

  const removeAppIcon = async () => {
    setRemovingIcon(true);
    try {
      const res = await fetch(getApiUrl('/api/admin/login-settings/icon'), { method: 'DELETE', headers });
      if (res.ok) {
        setHasAppIcon(false);
        setIconError(null);
        applyBranding({ appName: savedAppName, hasAppIcon: false });
      }
    } finally {
      setRemovingIcon(false);
    }
  };

  const fetchResourceLimits = useCallback(async () => {
    const res = await fetch(getApiUrl('/api/admin/resource-limits'), { headers });
    if (res.ok) {
      const data = await res.json() as ResourceLimitsStatus;
      setLimits(data);
      setRamInput(String(data.maxRamGb));
      setDiskInput(String(data.maxDiskGb));
    }
  }, [token]);

  useEffect(() => { void fetchResourceLimits(); }, [fetchResourceLimits]);

  const saveLimits = async () => {
    const maxRamGb = parseFloat(ramInput);
    const maxDiskGb = parseFloat(diskInput);
    if (!Number.isFinite(maxRamGb) || maxRamGb <= 0 || !Number.isFinite(maxDiskGb) || maxDiskGb <= 0) {
      setLimitsError('Valeurs invalides : les deux limites doivent être des nombres positifs.');
      return;
    }
    if (limits && (maxRamGb > limits.machineMaxRamGb || maxDiskGb > limits.machineMaxDiskGb)) {
      setLimitsError(`Valeurs invalides : max ${limits.machineMaxRamGb} Go de RAM et ${limits.machineMaxDiskGb} Go de disque sur cette machine.`);
      return;
    }
    setSavingLimits(true);
    setLimitsError(null);
    try {
      const res = await fetch(getApiUrl('/api/admin/resource-limits'), {
        method: 'PUT',
        headers,
        body: JSON.stringify({ maxRamGb, maxDiskGb }),
      });
      if (res.ok) {
        const data = await res.json() as ResourceLimitsStatus;
        setLimits(data);
        setLimitsSavedOk(true);
        setTimeout(() => setLimitsSavedOk(false), 2500);
      } else {
        const err = await res.json().catch(() => null) as { message?: string } | null;
        setLimitsError(err?.message ?? 'Échec de la sauvegarde');
      }
    } finally {
      setSavingLimits(false);
    }
  };

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

  const confirmRestart = async () => {
    setRestarting(true);
    setRestartError(null);
    try {
      const res = await fetch(getApiUrl('/api/admin/restart'), { method: 'POST', headers });
      if (res.ok) {
        setRestartTriggered(true);
        setRestartOpen(false);
      } else {
        const err = await res.json().catch(() => null) as { message?: string } | null;
        setRestartError(err?.message ?? 'Échec du redémarrage');
      }
    } catch {
      // La connexion peut être coupée par le redémarrage lui-même avant la réponse : on le
      // traite comme un succès plutôt que comme une erreur.
      setRestartTriggered(true);
      setRestartOpen(false);
    } finally {
      setRestarting(false);
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

      {/* ── Limites de ressources ── */}
      <div className="card bg-base-300">
        <div className="card-body gap-4">
          <h2 className="card-title text-base flex items-center gap-2">
            <Gauge size={16} className="opacity-60" /> Limites de ressources
          </h2>
          <p className="text-xs text-base-content/50 -mt-2">
            Plafonds appliqués au homelab (core + modules), pas à la machine hôte entière.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-base-content/70">RAM max (Go)</label>
              <div className="join">
                <input
                  type="number"
                  min="0.1"
                  max={limits?.machineMaxRamGb}
                  step="0.1"
                  className="input input-bordered input-sm w-full join-item"
                  value={ramInput}
                  onChange={e => setRamInput(e.target.value)}
                />
                {limits && (
                  <button
                    type="button"
                    className="btn btn-sm join-item"
                    title={`Utiliser le maximum de la machine (${limits.machineMaxRamGb} Go)`}
                    onClick={() => setRamInput(String(limits.machineMaxRamGb))}
                  >
                    Max
                  </button>
                )}
              </div>
              {limits && (
                <span className="text-[11px] text-base-content/40">Machine : {limits.machineMaxRamGb} Go</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-base-content/70">Disque max (Go)</label>
              <div className="join">
                <input
                  type="number"
                  min="1"
                  max={limits?.machineMaxDiskGb}
                  step="1"
                  className="input input-bordered input-sm w-full join-item"
                  value={diskInput}
                  onChange={e => setDiskInput(e.target.value)}
                />
                {limits && (
                  <button
                    type="button"
                    className="btn btn-sm join-item"
                    title={`Utiliser le maximum de la machine (${limits.machineMaxDiskGb} Go)`}
                    onClick={() => setDiskInput(String(limits.machineMaxDiskGb))}
                  >
                    Max
                  </button>
                )}
              </div>
              {limits && (
                <span className="text-[11px] text-base-content/40">Machine : {limits.machineMaxDiskGb} Go</span>
              )}
            </div>
          </div>

          {limitsError && <p className="text-xs text-error">{limitsError}</p>}

          <button
            className={`btn btn-sm gap-2 min-w-28 w-fit ${limitsSavedOk ? 'btn-success' : 'btn-primary'}`}
            onClick={() => void saveLimits()}
            disabled={savingLimits}
          >
            {savingLimits
              ? <span className="loading loading-spinner loading-xs" />
              : <Save size={14} />}
            {limitsSavedOk ? 'Sauvegardé !' : 'Appliquer'}
          </button>

          {limits && (
            <>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs text-base-content/60">
                  <span>Disque utilisé (homelab)</span>
                  <span className="font-mono">{limits.usedDiskGb.toFixed(2)} / {limits.maxDiskGb} Go</span>
                </div>
                <progress
                  className={`progress w-full h-2 ${limits.usedDiskGb / limits.maxDiskGb > 0.8 ? 'progress-error' : 'progress-accent'}`}
                  value={limits.usedDiskGb}
                  max={limits.maxDiskGb}
                />
                <p className="text-[11px] text-base-content/40">
                  Appliqué immédiatement : les installations de modules et uploads sont refusés au-delà.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs text-base-content/60">
                  <span>RAM (JVM)</span>
                  <span className="font-mono">actif {limits.activeMaxRamGb} Go / configuré {limits.maxRamGb} Go</span>
                </div>
                {limits.ramRestartRequired && (
                  <div className="alert bg-warning/10 border border-warning/30 text-xs py-2 px-3 flex items-start gap-2">
                    <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" />
                    <span>
                      Redémarrage requis pour appliquer cette limite : le fichier{' '}
                      <code className="font-mono bg-base-200 px-1 rounded">.env</code> a été mis à jour
                      automatiquement (<code className="font-mono bg-base-200 px-1 rounded">JAVA_XMX_GB</code>),
                      il ne reste qu'à redémarrer le conteneur avec le bouton
                      "Redémarrer le projet" ci-dessous.
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Redémarrage ── */}
      <div className="card bg-base-300">
        <div className="card-body gap-4">
          <h2 className="card-title text-base flex items-center gap-2">
            <Power size={16} className="opacity-60" /> Redémarrage
          </h2>
          <p className="text-xs text-base-content/50 -mt-2">
            Redémarre le conteneur de l'application (backend + frontend). Courte interruption
            pendant le redémarrage. Applique la limite de RAM configurée ci-dessus. Ne recrée pas
            le conteneur : un changement de chemins runtime ou d'autres variables définies dans
            docker-compose nécessite toujours un <code className="font-mono">docker compose up -d</code>{' '}
            manuel.
          </p>

          {!config.restartAvailable && (
            <p className="text-xs text-warning">
              Indisponible : le socket Docker n'est pas monté sur ce déploiement.
            </p>
          )}
          {restartError && <p className="text-xs text-error">{restartError}</p>}
          {restartTriggered && (
            <p className="text-xs text-success">
              Redémarrage en cours... l'application sera de nouveau disponible dans quelques secondes.
            </p>
          )}

          <button
            className="btn btn-sm btn-error gap-2 w-fit"
            onClick={() => setRestartOpen(true)}
            disabled={!config.restartAvailable || restartTriggered}
          >
            <Power size={14} />
            Redémarrer le projet
          </button>
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

      {/* ── Identité de l'application ── */}
      <div className="card bg-base-300">
        <div className="card-body gap-4">
          <h2 className="card-title text-base flex items-center gap-2">
            <Sparkles size={16} className="opacity-60" /> Identité de l'application
          </h2>
          <p className="text-xs text-base-content/50 -mt-2">
            Le nom et l'icône affichés dans l'onglet du navigateur.
          </p>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-16 h-16 rounded-xl bg-base-200 border border-base-content/10 flex items-center justify-center overflow-hidden shrink-0">
                {hasAppIcon ? (
                  <img
                    src={appIconUrl(iconCacheBust)}
                    alt="Icône de l'application"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <ImageIcon size={22} className="opacity-30" />
                )}
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="btn btn-xs btn-ghost gap-1"
                  onClick={() => iconFileInputRef.current?.click()}
                  disabled={uploadingIcon || removingIcon}
                >
                  {uploadingIcon
                    ? <span className="loading loading-spinner loading-xs" />
                    : <Upload size={12} />}
                </button>
                {hasAppIcon && (
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost text-error gap-1"
                    onClick={() => void removeAppIcon()}
                    disabled={uploadingIcon || removingIcon}
                    title="Supprimer l'icône"
                  >
                    {removingIcon
                      ? <span className="loading loading-spinner loading-xs" />
                      : <Trash2 size={12} />}
                  </button>
                )}
              </div>
              <input
                ref={iconFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) void uploadAppIcon(file);
                }}
              />
            </div>

            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs font-semibold text-base-content/70">Nom</label>
              <input
                type="text"
                className="input input-bordered input-sm w-full"
                value={appName}
                onChange={e => setAppName(e.target.value)}
                placeholder={DEFAULT_APP_NAME}
                maxLength={100}
              />
              <button
                type="button"
                className={`btn btn-sm gap-2 min-w-28 w-fit mt-1 ${nameSavedOk ? 'btn-success' : 'btn-primary'}`}
                onClick={() => void saveAppName()}
                disabled={savingName || appName === savedAppName}
              >
                {savingName
                  ? <span className="loading loading-spinner loading-xs" />
                  : <Save size={14} />}
                {nameSavedOk ? 'Sauvegardé !' : 'Enregistrer'}
              </button>
            </div>
          </div>

          {iconError && <p className="text-xs text-error">{iconError}</p>}
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

      {/* ── Modal confirmation redémarrage ── */}
      {restartOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-1">Redémarrer le projet ?</h3>
            <p className="text-xs opacity-60 mb-4">
              Le conteneur va redémarrer immédiatement. L'application sera indisponible pendant
              quelques secondes pour tous les utilisateurs connectés.
            </p>
            <div className="modal-action">
              <button className="btn btn-sm btn-ghost" onClick={() => setRestartOpen(false)} disabled={restarting}>
                Annuler
              </button>
              <button
                className="btn btn-sm btn-error"
                onClick={() => void confirmRestart()}
                disabled={restarting}
              >
                {restarting ? <span className="loading loading-spinner loading-xs" /> : 'Redémarrer'}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => !restarting && setRestartOpen(false)} />
        </div>
      )}
    </div>
  );
}
