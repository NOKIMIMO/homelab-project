import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Settings2 } from 'lucide-react';
import type { Module, TelemetryData } from '@app/types';
import { useAuth } from '@auth/AuthContext';
import { getApiUrl } from '@lib/api';
import { ModuleCard } from './ModuleCard';
import { TelemetryPanel } from './TelemetryPanel';

interface DashboardProps {
  modules: Module[];
  onRefresh: () => void;
  isModulesRefreshing: boolean;
}

export default function Dashboard({ modules, onRefresh, isModulesRefreshing }: DashboardProps) {
  const { token, isAdmin, adminPermissions } = useAuth();
  const canManageModules = isAdmin || adminPermissions.includes('MODULE_START_STOP');
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTelemetry = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/api/telemetry'), {
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
      });
      const telemetryData = await res.json();
      console.log('Fetched telemetry:', telemetryData);
      setTelemetry(telemetryData);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setCountdown(30);
    }
  }, [onRefresh, token]);

  const handleModuleAction = async (id: string, action: 'start' | 'stop' | 'dev') => {
    setActionLoading(id);
    try {
      await fetch(getApiUrl(`/api/modules/${id}/${action}`), { 
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // Initial fetch
  useEffect(() => {
    void fetchTelemetry();
  }, [fetchTelemetry]);

  // Countdown timer for auto-refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          void fetchTelemetry();
          return 30;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchTelemetry]);

  if (!telemetry) return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <span className="loading loading-bars loading-lg text-primary"></span>
        <p className="text-base-content/50 font-medium">Connexion au Hub Central...</p>
      </div>
    </div>
  );

  return (
    // header part
      <div className='p-6 mx-auto h-full overflow-y-auto'>
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Settings2 className="text-primary w-8 h-8" />
              Gestion des Modules
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
                Prochain refresh: {countdown}s
              </span>
              {
                isModulesRefreshing ? (
                  <button className="btn btn-outline btn-sm gap-2" disabled>
                    <span className="loading loading-spinner loading-xs"></span>
                    Rafraîchissement...
                  </button>
                ) : (
                  <button
                    className="btn btn-outline btn-sm gap-2 rounded-full"
                    onClick={fetchTelemetry}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Rafraîchir les Modules
                  </button>
                )
              }
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.length === 0 ? (
              <div className="col-span-full py-10 text-center bg-base-100/30 rounded-3xl border-2 border-dashed border-base-content/10">
                <p className="text-base-content/50 font-medium italic">
                  Aucun module dynamique découvert. Vérifiez vos fichiers homelab-module.json.
                </p>
              </div>
            ) : (
              modules.map((module) => (
                <ModuleCard
                  key={module.id} // or another unique identifier
                  modules={module}
                  handleModuleAction={handleModuleAction}
                  actionLoading={actionLoading}
                  canManageModules={canManageModules}
                />
              ))
            )}
          </div>
          

          <div className="divider opacity-50 mb-10 text-xs font-bold uppercase tracking-[.3em] text-base-content/20">Ressources Système</div>
          
          {/* different telemetry cards */}
          <TelemetryPanel telemetry={telemetry} />

        </div>
      </div>
  );
}
