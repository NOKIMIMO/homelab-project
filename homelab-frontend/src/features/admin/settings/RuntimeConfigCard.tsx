import { RefreshCw, FolderOpen, Puzzle, Home } from 'lucide-react';
import type { AppConfig } from '../services/appSettingsService';

const PATH_ENTRIES = [
  { key: 'appRoot',          label: 'App Root',          env: 'HOMELAB_APP_ROOT',          icon: Home },
  { key: 'modulesScanPath',  label: 'Modules Scan Path', env: 'HOMELAB_MODULES_SCAN_PATH',  icon: FolderOpen },
  { key: 'pluginsScanPath',  label: 'Plugins Scan Path', env: 'HOMELAB_PLUGINS_SCAN_PATH',  icon: Puzzle },
] as const;

interface Props {
  config: AppConfig;
  refreshing: boolean;
  onRefresh: () => void;
}

export default function RuntimeConfigCard({ config, refreshing, onRefresh }: Props) {
  return (
    <div className="card bg-base-300">
      <div className="card-body gap-4">
        <div className="flex items-center justify-between">
          <h2 className="card-title text-base">Configuration Runtime</h2>
          <button
            className="btn btn-xs btn-ghost gap-1"
            onClick={onRefresh}
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
  );
}
