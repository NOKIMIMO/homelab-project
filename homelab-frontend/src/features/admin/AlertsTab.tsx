import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, BellRing } from 'lucide-react';
import { useAuth } from '@auth/AuthContext';
import { getApiUrl } from '@lib/api';
import type { AlertRule, AlertEvent, AlertMetric, AlertSeverity } from '@app/types';
import AlertRuleModal from './AlertRuleModal';

const METRIC_LABEL: Record<AlertMetric, string> = {
  CPU: 'CPU',
  RAM: 'RAM',
  DISK: 'Disque',
  ACTIVE_MODULES: 'Modules actifs',
};

const METRIC_UNIT: Record<AlertMetric, string> = {
  CPU: '%',
  RAM: '%',
  DISK: '%',
  ACTIVE_MODULES: '',
};

const SEVERITY_BADGE: Record<AlertSeverity, string> = {
  INFO: 'badge-info',
  WARNING: 'badge-warning',
  CRITICAL: 'badge-error',
};

const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  INFO: 'Info',
  WARNING: 'Avertissement',
  CRITICAL: 'Critique',
};

function conditionLabel(rule: Pick<AlertRule, 'operator' | 'threshold' | 'metric'>): string {
  const symbol = rule.operator === 'ABOVE' ? '>' : '<';
  return `${symbol} ${rule.threshold}${METRIC_UNIT[rule.metric]}`;
}

export default function AlertsTab() {
  const { token } = useAuth();
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [modalRule, setModalRule] = useState<AlertRule | null | 'new'>(null);

  const headers: HeadersInit = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rulesRes, eventsRes] = await Promise.all([
        fetch(getApiUrl('/api/admin/alerts'), { headers }),
        fetch(getApiUrl('/api/admin/alerts/events?limit=50'), { headers }),
      ]);
      if (rulesRes.ok) setRules(await rulesRes.json() as AlertRule[]);
      if (eventsRes.ok) setEvents(await eventsRes.json() as AlertEvent[]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchData();
    const id = setInterval(() => void fetchData(), 10000);
    return () => clearInterval(id);
  }, [fetchData]);

  const toggleEnabled = async (rule: AlertRule) => {
    setActionId(rule.id);
    try {
      const res = await fetch(getApiUrl(`/api/admin/alerts/${rule.id}/enabled/${!rule.enabled}`), {
        method: 'PUT',
        headers,
      });
      if (res.ok) {
        const updated = await res.json() as AlertRule;
        setRules(prev => prev.map(r => r.id === updated.id ? updated : r));
      }
    } finally {
      setActionId(null);
    }
  };

  const deleteRule = async (id: number) => {
    setActionId(id);
    try {
      await fetch(getApiUrl(`/api/admin/alerts/${id}`), { method: 'DELETE', headers });
      setRules(prev => prev.filter(r => r.id !== id));
    } finally {
      setActionId(null);
    }
  };

  const handleSaved = (rule: AlertRule) => {
    setRules(prev => {
      const exists = prev.some(r => r.id === rule.id);
      return exists ? prev.map(r => r.id === rule.id ? rule : r) : [...prev, rule];
    });
  };

  return (
    <div className="h-full overflow-y-auto space-y-8 pr-1">

      {/* ── Règles d'alerte ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Règles d'alerte</h2>
          <div className="flex items-center gap-2">
            <button className="btn btn-xs btn-outline gap-1" onClick={fetchData} disabled={loading}>
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Actualiser
            </button>
            <button className="btn btn-xs btn-primary gap-1" onClick={() => setModalRule('new')}>
              <Plus size={12} />
              Nouvelle règle
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-base-content/10">
          <table className="table table-sm w-full">
            <thead>
              <tr className="bg-base-300 text-xs uppercase tracking-wide">
                <th>Nom</th>
                <th>Métrique</th>
                <th>Condition</th>
                <th>Criticité</th>
                <th>Activée</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-base-content/40 italic py-8">
                    Aucune règle d'alerte configurée
                  </td>
                </tr>
              ) : (
                rules.map(rule => (
                  <tr key={rule.id} className="hover">
                    <td className="font-semibold">{rule.name}</td>
                    <td>{METRIC_LABEL[rule.metric]}</td>
                    <td className="font-mono text-xs">{conditionLabel(rule)}</td>
                    <td>
                      <span className={`badge badge-sm ${SEVERITY_BADGE[rule.severity]}`}>
                        {SEVERITY_LABEL[rule.severity]}
                      </span>
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        className={`toggle toggle-sm toggle-success ${actionId === rule.id ? 'opacity-50' : ''}`}
                        checked={rule.enabled}
                        disabled={actionId === rule.id}
                        onChange={() => toggleEnabled(rule)}
                      />
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          className="btn btn-xs btn-ghost"
                          disabled={actionId === rule.id}
                          onClick={() => setModalRule(rule)}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          className="btn btn-xs btn-error btn-ghost"
                          disabled={actionId === rule.id}
                          onClick={() => deleteRule(rule.id)}
                        >
                          {actionId === rule.id
                            ? <span className="loading loading-spinner loading-xs" />
                            : <Trash2 size={12} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Historique des déclenchements ── */}
      <section>
        <h2 className="text-lg font-bold mb-3">Historique des déclenchements</h2>
        {events.length === 0 ? (
          <div className="alert bg-base-300 text-sm">
            <BellRing size={16} className="text-base-content/40" />
            <span>Aucune alerte déclenchée pour le moment.</span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-base-content/10">
            <table className="table table-sm w-full">
              <thead>
                <tr className="bg-base-300 text-xs uppercase tracking-wide">
                  <th>Règle</th>
                  <th>Criticité</th>
                  <th>Valeur</th>
                  <th>Déclenchée le</th>
                  <th>Résolue le</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {events.map(ev => (
                  <tr key={ev.id} className="hover">
                    <td className="font-semibold">{ev.ruleName}</td>
                    <td>
                      <span className={`badge badge-sm ${SEVERITY_BADGE[ev.severity]}`}>
                        {SEVERITY_LABEL[ev.severity]}
                      </span>
                    </td>
                    <td className="font-mono text-xs">
                      {ev.triggerValue}{METRIC_UNIT[ev.metric]} ({conditionLabel(ev)})
                    </td>
                    <td className="text-xs opacity-60">
                      {new Date(ev.triggeredAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="text-xs opacity-60">
                      {ev.resolvedAt ? new Date(ev.resolvedAt).toLocaleString('fr-FR') : '—'}
                    </td>
                    <td>
                      <span className={`badge badge-sm ${ev.resolved ? 'badge-success' : 'badge-error'}`}>
                        {ev.resolved ? 'Résolue' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalRule !== null && (
        <AlertRuleModal
          rule={modalRule === 'new' ? null : modalRule}
          onClose={() => setModalRule(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
