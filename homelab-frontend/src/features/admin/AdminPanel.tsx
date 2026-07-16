import { useMemo, useState } from 'react';
import { BellRing, Blocks, ScrollText, ShieldCheck, SlidersHorizontal, Users } from 'lucide-react';
import { useAuth } from '@auth/AuthContext';
import LogsTab from './LogsTab';
import AccessTab from './AccessTab';
import SettingsTab from './SettingsTab';
import ModuleBuilderTab from './ModuleBuilderTab';
import AlertsTab from './AlertsTab';
import RolesTab from './RolesTab';

type Tab = 'logs' | 'access' | 'settings' | 'modules' | 'alerts' | 'roles';

const TABS: { id: Tab; label: string; icon: React.ReactNode; adminOnly: boolean }[] = [
  { id: 'logs',     label: 'Logs',        icon: <ScrollText size={15} />, adminOnly: true },
  { id: 'access',   label: 'Access',      icon: <ShieldCheck size={15} />, adminOnly: true },
  { id: 'roles',    label: 'Roles',       icon: <Users size={15} />, adminOnly: false },
  { id: 'settings', label: 'Settings',    icon: <SlidersHorizontal size={15} />, adminOnly: true },
  { id: 'modules',  label: 'Modules',     icon: <Blocks size={15} />, adminOnly: true },
  { id: 'alerts',   label: 'Alerts',      icon: <BellRing size={15} />, adminOnly: true },
];

export default function AdminPanel() {
  const { isAdmin, adminPermissions } = useAuth();
  // Only the Roles tab is reachable via the MANAGE_ROLES administration permission alone; every
  // other tab still requires full admin.
  const visibleTabs = useMemo(
    () => TABS.filter(t => isAdmin || (!t.adminOnly && adminPermissions.includes('MANAGE_ROLES'))),
    [isAdmin, adminPermissions]
  );
  const [active, setActive] = useState<Tab>(visibleTabs[0]?.id ?? 'logs');

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      {/* header */}
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="text-primary w-7 h-7" />
        <h1 className="text-2xl font-black">Administration</h1>
      </div>

      {/* tabs */}
      <div role="tablist" className="tabs tabs-boxed bg-base-300 w-fit mb-6">
        {visibleTabs.map(tab => (
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
