import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Trash2, Download, FileText, FilePlus } from 'lucide-react';
import { useAuth } from '@auth/AuthContext';
import { getApiUrl } from '@lib/api';

interface LogEntry {
  timestamp: string;
  level: string;
  tag: string;
  message: string;
  caller: string;
}

interface LogFileInfo {
  name: string;
  sizeBytes: number;
  current: boolean;
  lastModified: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  const [autoScroll, setAutoScroll] = useState(true);
  const [loading, setLoading] = useState(false);
  const [logFiles, setLogFiles] = useState<LogFileInfo[]>([]);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [dumping, setDumping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filter !== 'ALL' ? `?level=${filter}` : '';
      const res = await fetch(getApiUrl(`/api/admin/logs${qs}`), { headers });
      if (res.ok) setLogs(await res.json() as LogEntry[]);
    } finally {
      setLoading(false);
    }
  }, [filter, token]);

  const fetchLogFiles = useCallback(async () => {
    const res = await fetch(getApiUrl('/api/admin/logs/files'), { headers });
    if (res.ok) setLogFiles(await res.json() as LogFileInfo[]);
  }, [token]);

  useEffect(() => {
    void fetchLogs();
    const id = setInterval(() => void fetchLogs(), 5000);
    return () => clearInterval(id);
  }, [fetchLogs]);

  useEffect(() => { void fetchLogFiles(); }, [fetchLogFiles]);

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, autoScroll]);

  const clearLogs = async () => {
    await fetch(getApiUrl('/api/admin/logs'), { method: 'DELETE', headers });
    setLogs([]);
  };

  const createManualDump = async () => {
    setDumping(true);
    try {
      const res = await fetch(getApiUrl('/api/admin/logs/files/manual'), { method: 'POST', headers });
      if (res.ok) void fetchLogFiles();
    } finally {
      setDumping(false);
    }
  };

  const downloadLogFile = async (name: string) => {
    setDownloadingFile(name);
    try {
      const res = await fetch(getApiUrl(`/api/admin/logs/files/${name}`), { headers });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingFile(null);
    }
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
            Refresh
          </button>
          <button className="btn btn-xs btn-error btn-outline gap-1" onClick={clearLogs}>
            <Trash2 size={12} />
            Clear
          </button>
        </div>
      </div>

      {/* log viewer */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-base-300 rounded-xl p-3 font-mono text-xs space-y-px">
        {logs.length === 0 ? (
          <p className="text-base-content/30 italic p-4 text-center">No log entries</p>
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
              <span className="break-all flex-1">{log.message}</span>
              <span className="opacity-20 ml-auto shrink-0 text-[10px] self-center">{log.caller}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <p className="text-xs text-base-content/40">
        {logs.length} entr{logs.length === 1 ? 'y' : 'ies'} · auto-refresh every 5s
      </p>

      {/* daily log file dumps (logback-spring.xml rolls homelab.log -> homelab-YYYY-MM-DD.log at midnight) */}
      <div className="bg-base-300 rounded-xl px-3 py-2 shrink-0 space-y-2">
        <div className="flex items-center gap-2">
          <FileText size={14} className="opacity-70" />
          <span className="text-sm font-semibold">Log files ({logFiles.length})</span>
          <button
            className="btn btn-xs btn-outline gap-1 ml-auto"
            disabled={dumping}
            onClick={() => void createManualDump()}
            title="Snapshot the current log into a new homelab-manual-*.log file"
          >
            {dumping
              ? <span className="loading loading-spinner loading-xs" />
              : <FilePlus size={12} />}
            Manual dump
          </button>
        </div>
        <details>
          <summary className="cursor-pointer text-xs text-base-content/60">Show files</summary>
          <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
            {logFiles.length === 0 ? (
              <p className="text-xs text-base-content/40 italic py-2">No log files yet</p>
            ) : (
              logFiles.map(f => (
                <div key={f.name} className="flex items-center gap-2 text-xs py-1 border-b border-base-content/5 last:border-none">
                  <span className="font-mono flex-1">{f.name}</span>
                  {f.current && <span className="badge badge-primary badge-xs">current</span>}
                  {f.name.includes('-manual-') && <span className="badge badge-secondary badge-xs">manual</span>}
                  <span className="opacity-40 tabular-nums">{formatSize(f.sizeBytes)}</span>
                  <button
                    className="btn btn-xs btn-ghost btn-square"
                    disabled={downloadingFile === f.name}
                    onClick={() => void downloadLogFile(f.name)}
                    title={`Download ${f.name}`}
                  >
                    {downloadingFile === f.name
                      ? <span className="loading loading-spinner loading-xs" />
                      : <Download size={12} />}
                  </button>
                </div>
              ))
            )}
          </div>
        </details>
      </div>
    </div>
  );
}
