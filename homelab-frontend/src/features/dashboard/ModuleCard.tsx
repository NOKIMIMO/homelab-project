import type { Module } from "@app/App";
import { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, Square, Play, SlidersHorizontal, Loader2 } from "lucide-react";
import ModuleParamsModal from "./ModuleParamsModal";

interface ModuleCardProps {
    modules: Module;
    handleModuleAction: (id: string, action: 'start' | 'stop' | 'dev') => void;
    actionLoading: string | null;
    canManageModules: boolean;
}

export function ModuleCard({ modules, handleModuleAction, actionLoading, canManageModules }: ModuleCardProps) {
    const [now, setNow] = useState(() => Date.now());
    const [paramsOpen, setParamsOpen] = useState(false);
    const isLoading = actionLoading === modules.id;

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 60_000);
        return () => clearInterval(interval);
    }, []);

    // Resync immediately when the module (re)starts, otherwise `now` can still hold
    // a timestamp from before the fresh uptimeStart and produce a negative diff.
    useEffect(() => {
        setNow(Date.now());
    }, [modules.uptimeStart]);

    const elapsed = modules.uptimeStart ? Math.max(0, now - modules.uptimeStart) : 0;
    const uptime = modules.uptimeStart
        ? `${Math.floor(elapsed / 3600000)}h ${Math.floor((elapsed % 3600000) / 60000)}m`
        : "--:--";

    return (
        <>
            <div key={modules.id} className={`card bg-base-300 border border-base-content/5 shadow-md overflow-hidden group transition-opacity ${isLoading ? 'opacity-70' : ''}`}>
                <div className="card-body p-5">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-base-100 rounded-xl">
                                <img
                                    src={modules.icon || (modules.icon === 'Image' ? '/default-image-icon.png' : '/default-module-icon.png')}
                                    alt=""
                                    className="h-8 w-8 rounded-sm object-cover opacity-80"
                                    loading="lazy"
                                />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{modules.name}</h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {modules.hasParams && (
                                <button
                                    className="btn btn-ghost btn-xs btn-square opacity-50 hover:opacity-100"
                                    title="Module settings"
                                    onClick={() => setParamsOpen(true)}
                                >
                                    <SlidersHorizontal size={14} />
                                </button>
                            )}
                            <div className={`badge font-bold gap-1 p-3 ${
                                isLoading ? 'badge-info' :
                                modules.status === 'ACTIVE' ? 'badge-success text-success-content' :
                                modules.status === 'INACTIVE' ? 'badge-ghost opacity-50' : 'badge-warning'
                            }`}>
                                {isLoading
                                    ? <Loader2 size={12} className="animate-spin" />
                                    : modules.status === 'ACTIVE' ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                                {isLoading ? 'IN PROGRESS' : modules.status}
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-base-content/70 mt-2 line-clamp-2 min-h-10">
                        {modules.description || "No description provided for this module."}
                    </p>

                    <div className="divider my-2 opacity-10"></div>

                    <div className="flex items-center justify-between mt-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-base-content/40 tracking-wider">Uptime</span>
                            <span className="text-sm font-bold font-mono">{uptime}</span>
                        </div>

                        {canManageModules && (
                            <div className="flex gap-2">
                                {modules.status === 'ACTIVE' ? (
                                    <button
                                        className="btn btn-error btn-sm btn-square"
                                        onClick={() => handleModuleAction(modules.id, 'stop')}
                                        disabled={isLoading}
                                    >
                                        {isLoading
                                            ? <span className="loading loading-spinner loading-xs"></span>
                                            : <Square size={16} />}
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-success btn-sm gap-2 px-4"
                                        onClick={() => handleModuleAction(modules.id, 'start')}
                                        disabled={isLoading}
                                    >
                                        {isLoading
                                            ? <span className="loading loading-spinner loading-xs"></span>
                                            : <Play size={16} />}
                                        {isLoading ? 'Starting...' : 'Start'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {paramsOpen && (
                <ModuleParamsModal
                    moduleId={modules.id}
                    moduleName={modules.name}
                    onClose={() => setParamsOpen(false)}
                />
            )}
        </>
    );
}
