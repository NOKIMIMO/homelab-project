import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '@auth/AuthContext';
import { getApiUrl } from '@lib/api';

interface LogEntry {
  timestamp: string;
  level: string;
  tag: string;
  message: string;
  caller: string;
  moduleId?: string | null;
}

interface ModuleOption {
  id: string;
  name: string;
}

const LEVEL_BADGE: Record<string, string> = {
  DEBUG: 'badge-ghost',
  INFO:  'badge-info',
  WARN:  'badge-warning',
  ERROR: 'badge-error',
};

const LEVEL_ROW: Record<string, string> = {
  DEBUG: 'opacity-50',
  INFO:  '',
  WARN:  'text-warning',
  ERROR: 'text-error',
};

const FILTERS = ['ALL', 'DEBUG', 'INFO', 'WARN', 'ERROR'] as const;

export default function LogsTab() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'ALL') params.set('level', filter);
      if (moduleFilter !== 'ALL') params.set('moduleId', moduleFilter);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(getApiUrl(`/api/admin/logs${qs}`), { headers });
      if (res.ok) setLogs(await res.json() as LogEntry[]);
    } finally {
      setLoading(false);
    }
  }, [filter, moduleFilter, token]);

  useEffect(() => {
    void fetchLogs();
    const id = setInterval(() => void fetchLogs(), 5000);
    return () => clearInterval(id);
  }, [fetchLogs]);

  useEffect(() => {
    void (async () => {
      const res = await fetch(getApiUrl('/api/modules'), { headers });
      if (res.ok) setModules(await res.json() as ModuleOption[]);
    })();
  }, [token]);

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, autoScroll]);

  const clearLogs = async () => {
    await fetch(getApiUrl('/api/admin/logs'), { method: 'DELETE', headers });
    setLogs([]);
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(l => (
          <button
            key={l}
            className={`btn btn-xs ${filter === l ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter(l)}
          >
            {l}
          </button>
        ))}
        <select
          className="select select-xs select-bordered w-auto"
          value={moduleFilter}
          onChange={e => setModuleFilter(e.target.value)}
        >
          <option value="ALL">Tous les modules</option>
          {modules.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-3">
          <label className="label cursor-pointer gap-2 text-xs py-0">
            <span className="label-text text-xs">Auto-scroll</span>
            <input
              type="checkbox"
              className="toggle toggle-xs toggle-primary"
              checked={autoScroll}
              onChange={e => setAutoScroll(e.target.checked)}
            />
          </label>
          <button className="btn btn-xs btn-outline gap-1" onClick={fetchLogs} disabled={loading}>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Rafraîchir
          </button>
          <button className="btn btn-xs btn-error btn-outline gap-1" onClick={clearLogs}>
            <Trash2 size={12} />
            Effacer
          </button>
        </div>
      </div>

      {/* log viewer */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-base-300 rounded-xl p-3 font-mono text-xs space-y-px">
        {logs.length === 0 ? (
          <p className="text-base-content/30 italic p-4 text-center">Aucune entrée de log</p>
        ) : (
          logs.map((log, i) => (
            <div
              key={i}
              className={`flex gap-2 py-[3px] border-b border-base-content/5 ${LEVEL_ROW[log.level] ?? ''}`}
            >
              <span className="opacity-40 shrink-0 tabular-nums">{log.timestamp}</span>
              <span className={`badge badge-xs shrink-0 self-center ${LEVEL_BADGE[log.level] ?? 'badge-ghost'}`}>
                {log.level}
              </span>
              {log.tag && (
                <span className="text-primary/70 shrink-0">[{log.tag}]</span>
              )}
              {log.moduleId && (
                <span className="badge badge-xs badge-outline shrink-0 self-center">{log.moduleId}</span>
              )}
              <span className="break-all flex-1">{log.message}</span>
              <span className="opacity-20 ml-auto shrink-0 text-[10px] self-center">{log.caller}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <p className="text-xs text-base-content/40">
        {logs.length} entrée(s) · rafraîchissement auto toutes les 5s
      </p>
    </div>
  );
}
