import type { TelemetryData } from "@app/types";
import { Cpu, MemoryStick, HardDrive, Activity, FolderOpen } from "lucide-react";
import { ModuleStorageBar } from "./ModuleStorageBar";

interface DashboardProps {
    telemetry: TelemetryData;
}

export function TelemetryPanel({ telemetry }: DashboardProps) {

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div className="card bg-base-100 shadow-xl border border-base-content/5 hover:-translate-y-1 transition-transform duration-300">
              <div className="card-body">
                <h2 className="card-title text-base-content/50 text-xs font-bold uppercase tracking-widest flex items-center gap-2"><Cpu className="text-primary w-5 h-5" /> Server CPU Load</h2>
                <div className="flex items-end gap-1 mt-2 mb-2"><span className="text-5xl font-black tracking-tighter text-base-content">{telemetry.cpu.total}</span><span className="text-2xl text-base-content/40 font-bold mb-1">%</span></div>
                <div className="flex flex-col gap-1 text-sm mt-1 mb-2">
                  <div className="flex items-center gap-2"><div className="badge badge-primary badge-xs"></div><span className="text-base-content/70">Homelab Core: <span className="font-bold text-primary">{telemetry.cpu.coreUsed}%</span></span></div>
                </div>
                <progress className={`progress w-full h-2 mt-auto ${telemetry.cpu.total > 80 ? 'progress-error' : 'progress-primary'}`} value={telemetry.cpu.total} max="100"></progress>
                <p className="text-xs text-base-content/40 mt-2">Total = Docker VM , not all of host; "Homelab Core" is scoped to the process and not normalized by core count (can exceed the Total)</p>
              </div>
            </div>

          <div className="card bg-base-100 shadow-xl border border-base-content/5 hover:-translate-y-1 transition-transform duration-300">
            <div className="card-body">
              <h2 className="card-title text-base-content/50 text-xs font-bold uppercase tracking-widest flex justify-between w-full">
                <span className="flex items-center gap-2"><MemoryStick className="text-secondary w-5 h-5" /> RAM Memory</span>
                <span className="badge badge-outline border-base-content/20 text-base-content/70">{telemetry.ram.total.toFixed(1)} GB total</span>
              </h2>
              <div className="flex items-end gap-1 mt-2 mb-2"><span className="text-5xl font-black tracking-tighter text-base-content">{telemetry.ram.used.toFixed(1)}</span><span className="text-2xl text-base-content/40 font-bold mb-1">GB used</span></div>
              <div className="flex flex-col gap-1 text-sm mt-1 mb-2">
                <div className="flex items-center gap-2"><div className="badge badge-primary badge-xs"></div><span className="text-base-content/70">Homelab Core: <span className="font-bold text-primary">{(telemetry.ram.coreUsed * 1024).toFixed(0)} MB</span></span></div>
              </div>
              <progress className={`progress w-full h-2 mt-auto ${telemetry.ram.used / telemetry.ram.total > 0.8 ? 'progress-error' : 'progress-secondary'}`} value={telemetry.ram.used} max={telemetry.ram.total}></progress>
              <p className="text-xs text-base-content/40 mt-2">Total/used = entire host machine; only "Homelab Core" is scoped to the project</p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl border border-base-content/5 hover:-translate-y-1 transition-transform duration-300">
            <div className="card-body">
              <h2 className="card-title text-base-content/50 text-xs font-bold uppercase tracking-widest flex justify-between w-full">
                <span className="flex items-center gap-2"><HardDrive className="text-accent w-5 h-5" /> OS Storage</span>
                <span className="badge badge-outline border-base-content/20 text-base-content/70">{telemetry.disk.total.toFixed(0)} GB</span>
              </h2>
              <div className="flex items-end gap-1 mt-2 mb-4"><span className="text-5xl font-black tracking-tighter text-base-content">{telemetry.disk.used.toFixed(0)}</span><span className="text-2xl text-base-content/40 font-bold mb-1">GB used</span></div>
              <progress className={`progress w-full h-2 ${telemetry.disk.used / telemetry.disk.total > 0.8 ? 'progress-error' : 'progress-accent'}`} value={telemetry.disk.used} max={telemetry.disk.total}></progress>
              <p className="text-xs text-base-content/40 mt-2">Entire disk volume, not just the homelab</p>
            </div>
          </div>

          <div className="card bg-warning text-warning-content shadow-xl shadow-warning/20 hover:-translate-y-1 transition-transform duration-300">
            <div className="card-body">
              <h2 className="card-title text-warning-content/70 text-xs font-bold uppercase tracking-widest flex items-center gap-2"><Activity className="text-white w-5 h-5"/> Module Resources</h2>
              <div className="flex items-center gap-4 mt-2 mb-2"><div className="text-6xl font-black tracking-tighter drop-shadow-lg">{telemetry.activeModulesCount}</div></div>
              <p className="text-sm font-medium text-warning-content/80 mt-auto">Sandboxed microservices</p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl border border-base-content/5 hover:-translate-y-1 transition-transform duration-300 col-span-full">
            <div className="card-body">
              <h2 className="card-title text-base-content/50 text-xs font-bold uppercase tracking-widest flex justify-between w-full">
                <span className="flex items-center gap-2"><FolderOpen className="text-success w-5 h-5" /> Homelab Size by Module</span>
                <span className="badge badge-outline border-base-content/20 text-base-content/70">{((telemetry.disk.coreStorageUsed + telemetry.disk.modulesStorageUsed) * 1024).toFixed(0)} MB</span>
              </h2>
              <div className="mt-4">
                <ModuleStorageBar
                  coreStorageGb={telemetry.disk.coreStorageUsed}
                  modules={telemetry.perModuleStorage}
                />
              </div>
              <p className="text-xs text-base-content/40 mt-auto pt-3">Actual folders and databases, scoped to the homelab (Core + each module)</p>
            </div>
          </div>
          </div>
    );
}