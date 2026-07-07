import type { TelemetryData } from "@app/types";
import { Cpu, MemoryStick, HardDrive, Activity } from "lucide-react";

interface DashboardProps {
    telemetry: TelemetryData;
}

export function TelemetryPanel({ telemetry }: DashboardProps) {
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                {/* <div className="flex items-center gap-2"><div className="badge badge-accent badge-xs"></div><span className="text-base-content/70">Modules: <span className="font-bold text-accent">{(telemetry.ram.modulesUsed * 1024).toFixed(0)} Mo</span></span></div> */}
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
{/* passage en mode image donc pas necessairement utile */}
          {/* <div className="card bg-base-100 shadow-xl border border-base-content/5 hover:-translate-y-1 transition-transform duration-300 bg-linear-to-br from-base-100 to-success/5">
            <div className="card-body">
              <h2 className="card-title text-base-content/50 text-xs font-bold uppercase tracking-widest flex items-center gap-2"><FolderOpen className="text-success w-5 h-5" /> Poids du Homelab</h2>
              <div className="flex items-end gap-1 mt-2 mb-2"><span className="text-5xl font-black tracking-tighter text-success">{((telemetry.disk.coreStorageUsed + telemetry.disk.modulesStorageUsed) * 1024).toFixed(0)}</span><span className="text-2xl text-success/60 font-bold mb-1">Mo</span></div>
              <div className="flex flex-col gap-1 text-sm mt-1">
                <div className="flex items-center justify-between"><span className="text-base-content/60">Core System:</span><span className="font-bold text-base-content/80">{(telemetry.disk.coreStorageUsed * 1024).toFixed(0)} Mo</span></div>
                <div className="flex items-center justify-between"><span className="text-base-content/60">Modules Data:</span><span className="font-bold text-base-content/80">{(telemetry.disk.modulesStorageUsed * 1024).toFixed(0)} Mo</span></div>
              </div>
              <p className="text-xs text-base-content/40 mt-auto pt-2 border-t border-success/10">Dossiers et bases de données</p>
            </div>
          </div> */}

{/* jamais etais vraiment exact (meme probleme que sur le gestionnaire de taches) */}
          {/* <div className="card bg-base-100 shadow-xl border border-base-content/5 hover:-translate-y-1 transition-transform duration-300">
            <div className="card-body">
              <h2 className="card-title text-base-content/50 text-xs font-bold uppercase tracking-widest flex items-center gap-2"><Clock className="text-info w-5 h-5" /> Activité Continue</h2>
              <div className="flex items-end gap-1 mt-2 mb-2"><span className="text-5xl font-black tracking-tighter drop-shadow-md text-info">{(telemetry.uptime / 3600).toFixed(1)}</span><span className="text-2xl text-info/60 font-bold mb-1">H</span></div>
              <p className="text-sm font-medium text-base-content/50 mt-auto">Temps d'activité du hardware</p>
            </div>
          </div> */}

          <div className="card bg-warning text-warning-content shadow-xl shadow-warning/20 hover:-translate-y-1 transition-transform duration-300">
            <div className="card-body">
              <h2 className="card-title text-warning-content/70 text-xs font-bold uppercase tracking-widest flex items-center gap-2"><Activity className="text-white w-5 h-5"/> Ressources Modules</h2>
              <div className="flex items-center gap-4 mt-2 mb-2"><div className="text-6xl font-black tracking-tighter drop-shadow-lg">{telemetry.activeModulesCount}</div></div>
              <p className="text-sm font-medium text-warning-content/80 mt-auto">Microservices en sandboxing</p>
            </div>
          </div>
          </div>
    );
}