import type { Module } from "@app/App";
import { useState } from "react";
import { ShieldCheck, ShieldAlert, Square, Play, SlidersHorizontal } from "lucide-react";
import ModuleParamsModal from "./ModuleParamsModal";

interface ModuleCardProps {
    modules: Module;
    handleModuleAction: (id: string, action: 'start' | 'stop' | 'dev') => void;
    actionLoading: string | null;
}

export function ModuleCard({ modules, handleModuleAction, actionLoading }: ModuleCardProps) {
    const [now, setNow] = useState(() => Date.now());
    const [paramsOpen, setParamsOpen] = useState(false);

    useState(() => {
        const interval = setInterval(() => setNow(Date.now()), 60_000);
        return () => clearInterval(interval);
    });

    const uptime = modules.uptimeStart
        ? `${Math.floor((now - modules.uptimeStart) / 3600000)}h ${Math.floor(((now - modules.uptimeStart) % 3600000) / 60000)}m`
        : "--:--";

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <div key={modules.id} className="card bg-base-300 border border-base-content/5 shadow-md overflow-hidden group">
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
                                    <p className="text-xs text-base-content/50 font-mono">ID: {modules.id}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {modules.hasParams && (
                                    <button
                                        className="btn btn-ghost btn-xs btn-square opacity-50 hover:opacity-100"
                                        title="Paramètres du module"
                                        onClick={() => setParamsOpen(true)}
                                    >
                                        <SlidersHorizontal size={14} />
                                    </button>
                                )}
                                <div className={`badge font-bold gap-1 p-3 ${
                                    modules.status === 'ACTIVE' ? 'badge-success text-success-content' :
                                    modules.status === 'INACTIVE' ? 'badge-ghost opacity-50' : 'badge-warning'
                                }`}>
                                    {modules.status === 'ACTIVE' ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                                    {modules.status}
                                </div>
                            </div>
                        </div>

                        <p className="text-sm text-base-content/70 mt-2 line-clamp-2 min-h-10">
                            {modules.description || "Aucune description fournie pour ce module."}
                        </p>

                        <div className="divider my-2 opacity-10"></div>

                        <div className="flex items-center justify-between mt-2">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-base-content/40 tracking-wider">Uptime</span>
                                <span className="text-sm font-bold font-mono">{uptime}</span>
                            </div>

                            <div className="flex gap-2">
                                {modules.status === 'ACTIVE' ? (
                                    <button
                                        className="btn btn-error btn-sm btn-square"
                                        onClick={() => handleModuleAction(modules.id, 'stop')}
                                        disabled={actionLoading === modules.id}
                                    >
                                        {actionLoading === modules.id
                                            ? <span className="loading loading-spinner loading-xs"></span>
                                            : <Square size={16} />}
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-success btn-sm gap-2 px-4"
                                        onClick={() => handleModuleAction(modules.id, 'start')}
                                        disabled={actionLoading === modules.id}
                                    >
                                        {actionLoading === modules.id
                                            ? <span className="loading loading-spinner loading-xs"></span>
                                            : <Play size={16} />}
                                        Lancer
                                    </button>
                                )}
                            </div>
                        </div>
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
