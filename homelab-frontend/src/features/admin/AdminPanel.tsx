import { useState } from 'react';
import { BellRing, Blocks, ScrollText, ShieldCheck, SlidersHorizontal, Users } from 'lucide-react';
import LogsTab from './LogsTab';
import AccessTab from './AccessTab';
import SettingsTab from './SettingsTab';
import ModuleBuilderTab from './ModuleBuilderTab';
import AlertsTab from './AlertsTab';
import RolesTab from './RolesTab';

type Tab = 'logs' | 'access' | 'settings' | 'modules' | 'alerts' | 'roles';

// Every tab is available to both full admins and ADMIN_ACCESS holders (RequireAdmin already gates
// the route). The operations reserved to the real administrator - ejecting the admin and changing
// the admin's account - are enforced per-action in AccessTab and on the backend, not by hiding tabs.
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'logs',     label: 'Logs',        icon: <ScrollText size={15} /> },
  { id: 'access',   label: 'Access',      icon: <ShieldCheck size={15} /> },
  { id: 'roles',    label: 'Roles',       icon: <Users size={15} /> },
  { id: 'settings', label: 'Settings',    icon: <SlidersHorizontal size={15} /> },
  { id: 'modules',  label: 'Modules',     icon: <Blocks size={15} /> },
  { id: 'alerts',   label: 'Alerts',      icon: <BellRing size={15} /> },
];

export default function AdminPanel() {
  const [active, setActive] = useState<Tab>(TABS[0].id);

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
        {active === 'modules'  && <ModuleBuilderTab />}
        {active === 'alerts'   && <AlertsTab />}
        {active === 'roles'    && <RolesTab />}
      </div>
    </div>
  );
}
