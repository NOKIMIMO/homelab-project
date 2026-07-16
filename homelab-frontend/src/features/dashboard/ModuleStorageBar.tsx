import type { ModuleStorageData } from "@app/types";

// Fixed categorical order (never cycled/reassigned when the module list changes)
// pulled from the app's own DaisyUI theme tokens, so it stays correct in light/dark.
const MODULE_COLORS = [
    "bg-primary",
    "bg-secondary",
    "bg-accent",
    "bg-info",
    "bg-success",
    "bg-warning",
    "bg-error",
    "bg-neutral",
] as const;

const CORE_COLOR = "bg-base-content/25";
const MAX_DIRECT_SLOTS = MODULE_COLORS.length;

interface Segment {
    key: string;
    label: string;
    valueGb: number;
    colorClass: string;
}

interface ModuleStorageBarProps {
    coreStorageGb: number;
    modules: ModuleStorageData[];
}

function formatMo(gb: number): string {
    return `${(gb * 1024).toFixed(gb * 1024 < 10 ? 1 : 0)} MB`;
}

export function ModuleStorageBar({ coreStorageGb, modules }: ModuleStorageBarProps) {
    const sortedModules = [...modules]
        .filter((m) => m.storageGb > 0)
        .sort((a, b) => b.storageGb - a.storageGb);

    const visibleModules = sortedModules.slice(0, MAX_DIRECT_SLOTS - 1);
    const overflowModules = sortedModules.slice(MAX_DIRECT_SLOTS - 1);
    const overflowGb = overflowModules.reduce((sum, m) => sum + m.storageGb, 0);

    const segments: Segment[] = [
        { key: "__core", label: "Homelab Core", valueGb: coreStorageGb, colorClass: CORE_COLOR },
        ...visibleModules.map((m, i) => ({
            key: m.id,
            label: m.name,
            valueGb: m.storageGb,
            colorClass: MODULE_COLORS[i],
        })),
    ];

    if (overflowModules.length > 0) {
        segments.push({
            key: "__other",
            label: `Other (${overflowModules.length})`,
            valueGb: overflowGb,
            colorClass: MODULE_COLORS[MODULE_COLORS.length - 1],
        });
    }

    const total = segments.reduce((sum, s) => sum + s.valueGb, 0);

    if (total <= 0) {
        return <p className="text-xs text-base-content/40">No storage data available.</p>;
    }

    return (
        <div>
            <div className="flex w-full h-3 gap-[2px] rounded-full overflow-hidden bg-base-200">
                {segments.map((s) => (
                    <div
                        key={s.key}
                        className={`tooltip h-full ${s.colorClass}`}
                        data-tip={`${s.label} — ${formatMo(s.valueGb)}`}
                        style={{ width: `${(s.valueGb / total) * 100}%` }}
                    />
                ))}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                {segments.map((s) => (
                    <div key={s.key} className="flex items-center gap-1.5 text-xs">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${s.colorClass}`} />
                        <span className="text-base-content/70">{s.label}:</span>
                        <span className="font-bold text-base-content/90">{formatMo(s.valueGb)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
