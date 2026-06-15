import { useState } from 'react';
import { ScrollText, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import LogsTab from './LogsTab';
import AccessTab from './AccessTab';
import SettingsTab from './SettingsTab';

type Tab = 'logs' | 'access' | 'settings';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'logs',     label: 'Logs',        icon: <ScrollText size={15} /> },
  { id: 'access',   label: 'Accès',       icon: <ShieldCheck size={15} /> },
  { id: 'settings', label: 'Paramètres',  icon: <SlidersHorizontal size={15} /> },
];

export default function AdminPanel() {
  const [active, setActive] = useState<Tab>('logs');

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      {/* header */}
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="text-primary w-7 h-7" />
        <h1 className="text-2xl font-black">Administration</h1>
      </div>

      {/* tabs */}
      <div role="tablist" className="tabs tabs-boxed bg-base-300 w-fit mb-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            className={`tab gap-2 font-medium ${active === tab.id ? 'tab-active' : ''}`}
            onClick={() => setActive(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {active === 'logs'     && <LogsTab />}
        {active === 'access'   && <AccessTab />}
        {active === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}
