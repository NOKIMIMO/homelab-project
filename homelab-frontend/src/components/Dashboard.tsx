import { useState, useEffect } from 'react';
import { Clock, RefreshCw, Cpu, MemoryStick, HardDrive, FolderOpen, Activity } from 'lucide-react';
import React from 'react';

export default function Dashboard() {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [countdown, setCountdown] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTelemetry = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('http://localhost:8080/api/telemetry');
      setTelemetry(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
      setCountdown(30);
    }
  };

  useEffect(() => { fetchTelemetry(); }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { fetchTelemetry(); return 30; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!telemetry) return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <span className="loading loading-bars loading-lg text-primary"></span>
        <p className="text-base-content/50 font-medium">Connexion au Hub Central...</p>
      </div>
    </div>
  );

  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 mt-4 lg:mt-0">
        <div>
          <h1 className="text-4xl font-black mb-2 tracking-tight">Dashboard Système</h1>
          <p className="text-base-content/70 font-medium text-lg">Surveillance des ressources serveur</p>
        </div>
        <div className="flex items-center gap-4 bg-base-100/50 backdrop-blur-md p-3 px-5 rounded-2xl shadow-sm border border-base-content/10">
          <div className="text-sm font-medium flex items-center gap-2">
            <span className="text-base-content/60">Actualisation dans</span>
            <span className="countdown font-mono text-xl text-primary font-bold">
              <span style={{"--value": countdown} as React.CSSProperties}></span>
            </span>
            <span className="text-base-content/60">s</span>
          </div>
          <div className="divider divider-horizontal my-1 w-[1px] bg-base-content/10"></div>
          <button className="btn btn-primary btn-sm rounded-full px-4 border-none shadow-md shadow-primary/30 flex items-center gap-2" onClick={fetchTelemetry} disabled={isRefreshing}>
            {isRefreshing ? <span className="loading loading-spinner loading-xs"></span> : <RefreshCw size={14} />}
            Rafraîchir
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card bg-base-100 shadow-xl border border-base-content/5 hover:-translate-y-1 transition-transform duration-300">
          <div className="card-body">
            <h2 className="card-title text-base-content/50 text-xs font-bold uppercase tracking-widest flex items-center gap-2"><Cpu className="text-primary w-5 h-5" /> Charge CPU Centrale</h2>
            <div className="flex items-end gap-1 mt-2 mb-4"><span className="text-5xl font-black tracking-tighter text-base-content">{telemetry.cpu}</span><span className="text-2xl text-base-content/40 font-bold mb-1">%</span></div>
            <progress className={`progress w-full h-2 ${telemetry.cpu > 80 ? 'progress-error' : 'progress-primary'}`} value={telemetry.cpu} max="100"></progress>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl border border-base-content/5 hover:-translate-y-1 transition-transform duration-300">
          <div className="card-body">
            <h2 className="card-title text-base-content/50 text-xs font-bold uppercase tracking-widest flex justify-between w-full">
              <span className="flex items-center gap-2"><MemoryStick className="text-secondary w-5 h-5" /> Mémoire RAM</span>
              <span className="badge badge-outline border-base-content/20 text-base-content/70">{telemetry.ram.total.toFixed(1)} Go total</span>
            </h2>
            <div className="flex items-end gap-1 mt-2 mb-2"><span className="text-5xl font-black tracking-tighter text-base-content">{telemetry.ram.used.toFixed(1)}</span><span className="text-2xl text-base-content/40 font-bold mb-1">Go utilisés</span></div>
            <div className="flex flex-col gap-1 text-sm mt-1 mb-2">
              <div className="flex items-center gap-2"><div className="badge badge-primary badge-xs"></div><span className="text-base-content/70">Homelab Core: <span className="font-bold text-primary">{(telemetry.ram.coreUsed * 1024).toFixed(0)} Mo</span></span></div>
              <div className="flex items-center gap-2"><div className="badge badge-accent badge-xs"></div><span className="text-base-content/70">Modules: <span className="font-bold text-accent">{(telemetry.ram.modulesUsed * 1024).toFixed(0)} Mo</span></span></div>
            </div>
            <progress className={`progress w-full h-2 mt-auto ${telemetry.ram.used / telemetry.ram.total > 0.8 ? 'progress-error' : 'progress-secondary'}`} value={telemetry.ram.used} max={telemetry.ram.total}></progress>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl border border-base-content/5 hover:-translate-y-1 transition-transform duration-300">
          <div className="card-body">
            <h2 className="card-title text-base-content/50 text-xs font-bold uppercase tracking-widest flex justify-between w-full">
              <span className="flex items-center gap-2"><HardDrive className="text-accent w-5 h-5" /> Stockage OS</span>
              <span className="badge badge-outline border-base-content/20 text-base-content/70">{telemetry.disk.total.toFixed(0)} Go</span>
            </h2>
            <div className="flex items-end gap-1 mt-2 mb-4"><span className="text-5xl font-black tracking-tighter text-base-content">{telemetry.disk.used.toFixed(0)}</span><span className="text-2xl text-base-content/40 font-bold mb-1">Go occupés</span></div>
            <progress className={`progress w-full h-2 ${telemetry.disk.used / telemetry.disk.total > 0.8 ? 'progress-error' : 'progress-accent'}`} value={telemetry.disk.used} max={telemetry.disk.total}></progress>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl border border-base-content/5 hover:-translate-y-1 transition-transform duration-300 bg-gradient-to-br from-base-100 to-success/5">
          <div className="card-body">
            <h2 className="card-title text-base-content/50 text-xs font-bold uppercase tracking-widest flex items-center gap-2"><FolderOpen className="text-success w-5 h-5" /> Poids du Homelab</h2>
            <div className="flex items-end gap-1 mt-2 mb-2"><span className="text-5xl font-black tracking-tighter text-success">{((telemetry.disk.coreStorageUsed + telemetry.disk.modulesStorageUsed) * 1024).toFixed(0)}</span><span className="text-2xl text-success/60 font-bold mb-1">Mo</span></div>
            <div className="flex flex-col gap-1 text-sm mt-1">
              <div className="flex items-center justify-between"><span className="text-base-content/60">Core System:</span><span className="font-bold text-base-content/80">{(telemetry.disk.coreStorageUsed * 1024).toFixed(0)} Mo</span></div>
              <div className="flex items-center justify-between"><span className="text-base-content/60">Modules Data:</span><span className="font-bold text-base-content/80">{(telemetry.disk.modulesStorageUsed * 1024).toFixed(0)} Mo</span></div>
            </div>
            <p className="text-xs text-base-content/40 mt-auto pt-2 border-t border-success/10">Dossiers et bases de données</p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl border border-base-content/5 hover:-translate-y-1 transition-transform duration-300">
          <div className="card-body">
            <h2 className="card-title text-base-content/50 text-xs font-bold uppercase tracking-widest flex items-center gap-2"><Clock className="text-info w-5 h-5" /> Activité Continue</h2>
            <div className="flex items-end gap-1 mt-2 mb-2"><span className="text-5xl font-black tracking-tighter drop-shadow-md text-info">{(telemetry.uptime / 3600).toFixed(1)}</span><span className="text-2xl text-info/60 font-bold mb-1">H</span></div>
            <p className="text-sm font-medium text-base-content/50 mt-auto">Temps d'activité du hardware</p>
          </div>
        </div>

        <div className="card bg-warning text-warning-content shadow-xl shadow-warning/20 hover:-translate-y-1 transition-transform duration-300">
          <div className="card-body">
            <h2 className="card-title text-warning-content/70 text-xs font-bold uppercase tracking-widest flex items-center gap-2"><Activity className="text-white w-5 h-5" /> Ressources Modules</h2>
            <div className="flex items-center gap-4 mt-2 mb-2"><div className="text-6xl font-black tracking-tighter drop-shadow-lg">{telemetry.activeModulesCount}</div></div>
            <p className="text-sm font-medium text-warning-content/80 mt-auto">Microservices en sandboxing</p>
          </div>
        </div>
      </div>
    </div>
  );
}
