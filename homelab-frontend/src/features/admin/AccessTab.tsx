import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@auth/AuthContext';
import RecoveryCodeReveal from '@ui/RecoveryCodeReveal';
import UsersTable from './access/UsersTable';
import ModulesAccessTable from './access/ModulesAccessTable';
import SignupRequestsSection from './access/SignupRequestsSection';
import PasswordResetSection from './access/PasswordResetSection';
import {
  fetchUsers, deleteUser as deleteUserRequest, setUserAdmin,
  fetchSignupRequests, approveSignupRequest, rejectSignupRequest,
  fetchPasswordResetRequests, approvePasswordReset as approvePasswordResetRequest, rejectPasswordReset as rejectPasswordResetRequest,
  type AdminUser, type SignupRequest, type PasswordResetRequest,
} from './services/accessService';
import { fetchModuleSettings, updateModuleSettings, type ModuleSettings } from './services/moduleSettingsService';

export default function AccessTab() {
  const { token, userName } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [requests, setRequests] = useState<SignupRequest[]>([]);
  const [passwordResetRequests, setPasswordResetRequests] = useState<PasswordResetRequest[]>([]);
  const [moduleSettings, setModuleSettings] = useState<Record<string, ModuleSettings>>({});
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [savingModuleId, setSavingModuleId] = useState<string | null>(null);
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);

  const headers: HeadersInit = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, requestsRes, moduleSettingsRes, resetRequestsRes] = await Promise.all([
        fetchUsers(headers),
        fetchSignupRequests(headers),
        fetchModuleSettings(headers),
        fetchPasswordResetRequests(headers),
      ]);
      if (usersRes) setUsers(usersRes);
      if (requestsRes) setRequests(requestsRes);
      if (moduleSettingsRes) setModuleSettings(moduleSettingsRes);
      if (resetRequestsRes) setPasswordResetRequests(resetRequestsRes);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const deleteUser = async (id: number, email: string) => {
    if (email === userName) {
      alert("Vous ne pouvez pas supprimer votre propre compte.");
      return;
    }

    setActionId(id);
    try {
      await deleteUserRequest(id, headers);
      setUsers(prev => prev.filter(u => u.id !== id));
    } finally {
      setActionId(null);
    }
  };

  const switchAdminStatus = async (id: number, isAdmin: boolean, email: string) => {
    if (email === userName) {
      alert("Vous ne pouvez pas modifier votre propre statut d'administrateur.");
      return;
    }

    setActionId(id);
    try {
      await setUserAdmin(id, !isAdmin, headers);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isAdmin: !isAdmin } : u));
    } finally {
      setActionId(null);
    }
  };

  const toggleModuleSetting = async (moduleId: string, key: keyof ModuleSettings) => {
    const current = moduleSettings[moduleId] ?? { writeAdminOnly: false, deleteAdminOnly: false };
    const next = { ...current, [key]: !current[key] };
    setSavingModuleId(moduleId);
    try {
      const res = await updateModuleSettings(moduleId, next, { ...headers, 'Content-Type': 'application/json' });
      if (!res.ok) {
        alert("Échec de l'enregistrement des réglages du module.");
        return;
      }
      setModuleSettings(prev => ({ ...prev, [moduleId]: next }));
    } finally {
      setSavingModuleId(null);
    }
  };

  const handleSignupRequest = async (id: number, action: 'approve' | 'reject') => {
    setActionId(id);
    try {
      await (action === 'approve' ? approveSignupRequest : rejectSignupRequest)(id, headers);
      void fetchData();
    } finally {
      setActionId(null);
    }
  };

  const approvePasswordReset = async (id: number) => {
    setActionId(id);
    try {
      const res = await approvePasswordResetRequest(id, headers);
      if (!res.ok) {
        alert("Échec de l'approbation de la demande.");
        return;
      }
      let data: { success: boolean; temporaryPassword?: string; message?: string };
      try {
        data = await res.json() as { success: boolean; temporaryPassword?: string; message?: string };
      } catch {
        alert("Réponse invalide du serveur.");
        return;
      }
      if (data.success && data.temporaryPassword) {
        setRevealedPassword(data.temporaryPassword);
      } else if (data.message) {
        alert(data.message);
      }
      void fetchData();
    } finally {
      setActionId(null);
    }
  };

  const rejectPasswordReset = async (id: number) => {
    setActionId(id);
    try {
      await rejectPasswordResetRequest(id, headers);
      void fetchData();
    } finally {
      setActionId(null);
    }
  };

  const pending = requests.filter(r => r.status === 'PENDING');
  const processed = requests.filter(r => r.status !== 'PENDING');
  const pendingPasswordResets = passwordResetRequests.filter(r => r.status === 'PENDING');
  const processedPasswordResets = passwordResetRequests.filter(r => r.status !== 'PENDING');

  return (
    <div className="h-full overflow-y-auto space-y-8 pr-1">
      <UsersTable
        users={users}
        currentUserEmail={userName}
        actionId={actionId}
        loading={loading}
        onRefresh={fetchData}
        onToggleAdmin={switchAdminStatus}
        onDelete={deleteUser}
      />

      <ModulesAccessTable
        moduleSettings={moduleSettings}
        savingModuleId={savingModuleId}
        onToggle={toggleModuleSetting}
      />

      <SignupRequestsSection
        pending={pending}
        processed={processed}
        actionId={actionId}
        onApprove={id => handleSignupRequest(id, 'approve')}
        onReject={id => handleSignupRequest(id, 'reject')}
      />

      <PasswordResetSection
        pending={pendingPasswordResets}
        processed={processedPasswordResets}
        actionId={actionId}
        onApprove={approvePasswordReset}
        onReject={rejectPasswordReset}
      />

      {revealedPassword && (
        <RecoveryCodeReveal
          code={revealedPassword}
          onClose={() => setRevealedPassword(null)}
          label="Mot de passe temporaire"
          description="Communiquez ce mot de passe temporaire à l'utilisateur par un canal sûr. Il n'est valable qu'une seule connexion : il devra en définir un nouveau juste après."
          confirmLabel="J'ai transmis ce mot de passe"
        />
      )}
    </div>
  );
}
