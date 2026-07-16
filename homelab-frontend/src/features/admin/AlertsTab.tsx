import { useState, useEffect, useCallback } from 'react';
import { BellRing, Plus, Trash2, RefreshCw, History } from 'lucide-react';
import type {
  AlertRule,
  AlertEvent,
  AlertOptions,
  AlertRuleRequest,
  MetricType,
  AlertOperator,
  AlertSeverity,
} from '@app/types';
import { useAuth } from '@auth/AuthContext';
import { getApiUrl } from '@lib/api';

const SEVERITY_BADGE: Record<AlertSeverity, string> = {
  INFO: 'badge-info',
  LOW: 'badge-success',
  MEDIUM: 'badge-warning',
  HIGH: 'badge-error',
  CRITICAL: 'badge-error badge-outline',
};

const EMPTY_FORM: AlertRuleRequest = {
  name: '',
  metric: 'RAM',
  operator: 'GTE',
  threshold: 90,
  severity: 'HIGH',
  enabled: true,
};

export default function AlertsTab() {
  const { token } = useAuth();
  const [options, setOptions] = useState<AlertOptions | null>(null);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [form, setForm] = useState<AlertRuleRequest>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const headers: HeadersInit = token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };

  const fetchOptions = useCallback(async () => {
    const res = await fetch(getApiUrl('/api/alerts/options'), { headers });
    if (res.ok) setOptions(await res.json() as AlertOptions);
  }, [token]);

  const fetchRules = useCallback(async () => {
    const res = await fetch(getApiUrl('/api/alerts/rules'), { headers });
    if (res.ok) setRules(await res.json() as AlertRule[]);
  }, [token]);

  const fetchEvents = useCallback(async () => {
    const res = await fetch(getApiUrl('/api/alerts/events'), { headers });
    if (res.ok) {
      const data = await res.json() as { events: AlertEvent[] };
      setEvents(data.events);
    }
  }, [token]);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchRules(), fetchEvents()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchRules, fetchEvents]);

  useEffect(() => { void fetchOptions(); }, [fetchOptions]);
  useEffect(() => { void refreshAll(); }, [refreshAll]);

  const metricUnit = (metric: MetricType) =>
    options?.metrics.find(m => m.name === metric)?.unit ?? '%';

  const createRule = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(getApiUrl('/api/alerts/rules'), {
        method: 'POST',
        headers,
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm(EMPTY_FORM);
        void fetchRules();
      } else {
        const body = await res.json().catch(() => null) as { error?: string } | null;
        setError(body?.error ?? 'Unable to create');
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async (rule: AlertRule) => {
    const res = await fetch(getApiUrl(`/api/alerts/rules/${rule.id}`), {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        name: rule.name,
        metric: rule.metric,
        operator: rule.operator,
        threshold: rule.threshold,
        severity: rule.severity,
        enabled: !rule.enabled,
      } satisfies AlertRuleRequest),
    });
    if (res.ok) void fetchRules();
  };

  const deleteRule = async (id: number) => {
    const res = await fetch(getApiUrl(`/api/alerts/rules/${id}`), { method: 'DELETE', headers });
    if (res.ok) void fetchRules();
  };

  if (!options) return (
    <div className="flex justify-center pt-20">
      <span className="loading loading-bars loading-md text-primary" />
    </div>
  );

  return (
    <div className="h-full overflow-y-auto space-y-6 max-w-3xl pr-1">

      {/* ── Create alert ── */}
      <div className="card bg-base-300">
        <div className="card-body gap-4">
          <h2 className="card-title text-base flex items-center gap-2">
            <BellRing size={16} className="opacity-60" /> New alert
          </h2>
          <p className="text-xs text-base-content/50 -mt-2">
            Monitors a system metric and triggers an event when the threshold is crossed.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="form-control">
              <span className="label-text text-xs mb-1">Name</span>
              <input
                className="input input-bordered input-sm"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="E.g. RAM almost full"
              />
            </label>

            <label className="form-control">
              <span className="label-text text-xs mb-1">Severity</span>
              <select
                className="select select-bordered select-sm"
                value={form.severity}
                onChange={e => setForm({ ...form, severity: e.target.value as AlertSeverity })}
              >
                {options.severities.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>

            <label className="form-control">
              <span className="label-text text-xs mb-1">Metric</span>
              <select
                className="select select-bordered select-sm"
                value={form.metric}
                onChange={e => setForm({ ...form, metric: e.target.value as MetricType })}
              >
                {options.metrics.map(m => <option key={m.name} value={m.name}>{m.label}</option>)}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="form-control">
                <span className="label-text text-xs mb-1">Condition</span>
                <select
                  className="select select-bordered select-sm"
                  value={form.operator}
                  onChange={e => setForm({ ...form, operator: e.target.value as AlertOperator })}
                >
                  {options.operators.map(o => <option key={o.name} value={o.name}>{o.symbol}</option>)}
                </select>
              </label>
              <label className="form-control">
                <span className="label-text text-xs mb-1">Threshold ({metricUnit(form.metric)})</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="input input-bordered input-sm"
                  value={form.threshold}
                  onChange={e => setForm({ ...form, threshold: Number(e.target.value) })}
                />
              </label>
            </div>
          </div>

          {error && <p className="text-xs text-error">{error}</p>}

          <div className="flex justify-end">
            <button
              className="btn btn-sm btn-primary gap-2"
              onClick={() => void createRule()}
              disabled={saving || form.name.trim() === ''}
            >
              {saving ? <span className="loading loading-spinner loading-xs" /> : <Plus size={14} />}
              Create alert
            </button>
          </div>
        </div>
      </div>

      {/* ── Configured alerts ── */}
      <div className="card bg-base-300">
        <div className="card-body gap-3">
          <div className="flex items-center justify-between">
            <h2 className="card-title text-base">Configured alerts</h2>
            <button className="btn btn-xs btn-ghost gap-1" onClick={() => void refreshAll()} disabled={refreshing}>
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>

          {rules.length === 0 ? (
            <p className="text-sm text-base-content/50 italic">No alerts configured.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {rules.map(rule => (
                <div key={rule.id} className="flex items-center gap-3 bg-base-200 rounded-lg px-3 py-2">
                  <input
                    type="checkbox"
                    className="toggle toggle-sm toggle-primary"
                    checked={rule.enabled}
                    onChange={() => void toggleRule(rule)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{rule.name}</span>
                      <span className={`badge badge-sm ${SEVERITY_BADGE[rule.severity]}`}>{rule.severity}</span>
                    </div>
                    <span className="text-xs text-base-content/50 font-mono">
                      {rule.metric} {rule.operatorSymbol} {rule.threshold}{metricUnit(rule.metric)}
                    </span>
                  </div>
                  <button
                    className="btn btn-xs btn-ghost text-error"
                    onClick={() => void deleteRule(rule.id)}
                    aria-label="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent events ── */}
      <div className="card bg-base-300">
        <div className="card-body gap-3">
          <h2 className="card-title text-base flex items-center gap-2">
            <History size={16} className="opacity-60" /> Recent events
          </h2>
          {events.length === 0 ? (
            <p className="text-sm text-base-content/50 italic">No events triggered.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {events.map(ev => (
                <div key={ev.id} className="flex items-center gap-3 bg-base-200 rounded-lg px-3 py-2">
                  <span className={`badge badge-sm ${SEVERITY_BADGE[ev.severity]}`}>{ev.severity}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm truncate block">{ev.message}</span>
                    <span className="text-xs text-base-content/40">
                      {ev.ruleName} · {new Date(ev.triggeredAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
