import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@auth/AuthContext';
import RecoveryCodeReveal from '@ui/RecoveryCodeReveal';
import RuntimeConfigCard from './settings/RuntimeConfigCard';
import LogLevelCard from './settings/LogLevelCard';
import LoginDescriptionCard from './settings/LoginDescriptionCard';
import RecoveryCodeCard from './settings/RecoveryCodeCard';
import {
  fetchAppConfig, updateLogLevel, fetchRecoveryCodeStatus, regenerateRecoveryCode as regenerateRecoveryCodeRequest,
  fetchLoginDescription, updateLoginDescription,
  type AppConfig, type RecoveryCodeStatus,
} from './services/appSettingsService';

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
      const data = await fetchAppConfig(headers);
      if (data) {
        setConfig(data);
        setSelectedLevel(data.logLevel);
      }
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { void fetchConfig(); }, [fetchConfig]);

  const fetchRecoveryStatus = useCallback(async () => {
    const status = await fetchRecoveryCodeStatus(headers);
    if (status) setRecoveryStatus(status);
  }, [token]);

  useEffect(() => { void fetchRecoveryStatus(); }, [fetchRecoveryStatus]);

  const loadLoginDescription = useCallback(async () => {
    const description = await fetchLoginDescription();
    if (description !== null) {
      setLoginDescription(description);
      setSavedLoginDescription(description);
    }
  }, []);

  useEffect(() => { void loadLoginDescription(); }, [loadLoginDescription]);

  const saveLoginDescription = async () => {
    setSavingDescription(true);
    try {
      const res = await updateLoginDescription(loginDescription, headers);
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
      const res = await regenerateRecoveryCodeRequest(headers);
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
      const res = await updateLogLevel(selectedLevel, headers);
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

  return (
    <div className="h-full overflow-y-auto space-y-6 max-w-2xl pr-1">
      <RuntimeConfigCard config={config} refreshing={refreshing} onRefresh={fetchConfig} />

      <LogLevelCard
        currentLevel={config.logLevel}
        selectedLevel={selectedLevel}
        saving={saving}
        savedOk={savedOk}
        onChange={setSelectedLevel}
        onSave={() => void saveLogLevel()}
      />

      <LoginDescriptionCard
        description={loginDescription}
        savedDescription={savedLoginDescription}
        saving={savingDescription}
        savedOk={descriptionSavedOk}
        onChange={setLoginDescription}
        onSave={() => void saveLoginDescription()}
      />

      <RecoveryCodeCard
        status={recoveryStatus}
        regenerating={regenerating}
        onRegenerate={() => void regenerateRecoveryCode()}
      />

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
